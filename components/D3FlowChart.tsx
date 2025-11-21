
import React, { useEffect, useRef } from 'react';
import * as d3Base from 'd3';
import { VisualData } from '../types';

const d3 = d3Base as any;

interface Props {
  data: VisualData;
  width?: number;
  height?: number;
}

export const D3FlowChart: React.FC<Props> = ({ data, width = 800, height = 400 }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // SCI Logic Flow Colors
    const colors = {
      root: { fill: "#1e3a8a", stroke: "#172554", text: "#ffffff" }, 
      node: { fill: "#ffffff", stroke: "#64748b", text: "#1e293b" },  
      link: "#94a3b8"
    };

    const g = svg.append("g");

    // Zoom
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event: any) => {
        g.attr("transform", event.transform);
      });
    svg.call(zoom);

    // Use simple Tree layout for logic flow
    const rootId = data.nodes[0].id; // Assume first is root for simplicity or find orphan
    const stratify = d3.stratify()
      .id((d: any) => d.id)
      .parentId((d: any) => {
        const link = data.links.find((l: any) => l.target === d.id);
        return link ? link.source : (d.id === rootId ? null : rootId);
      });

    let root;
    try {
        root = stratify(data.nodes);
    } catch(e) {
        // Fallback if data isn't perfect hierarchy
        return;
    }

    const treeLayout = d3.tree().size([width - 100, height - 100]);
    treeLayout(root);

    // Center
    const treeG = g.append("g").attr("transform", "translate(50, 50)");

    // Links
    treeG.selectAll(".link")
      .data(root.links())
      .enter().append("path")
      .attr("fill", "none")
      .attr("stroke", colors.link)
      .attr("stroke-width", 1.5)
      .attr("d", d3.linkVertical()
        .x((d: any) => d.x)
        .y((d: any) => d.y) as any
      );

    // Nodes
    const node = treeG.selectAll(".node")
      .data(root.descendants())
      .enter().append("g")
      .attr("transform", (d: any) => `translate(${d.x},${d.y})`);

    node.append("rect")
      .attr("width", 100)
      .attr("height", 40)
      .attr("x", -50)
      .attr("y", -20)
      .attr("rx", 4)
      .attr("fill", (d: any) => d.depth === 0 ? colors.root.fill : colors.node.fill)
      .attr("stroke", (d: any) => d.depth === 0 ? colors.root.stroke : colors.node.stroke)
      .attr("stroke-width", 1.5);

    node.append("text")
      .attr("dy", 4)
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("fill", (d: any) => d.depth === 0 ? colors.root.text : colors.node.text)
      .text((d: any) => d.data.label);

  }, [data, width, height]);

  return (
    <div className="w-full flex justify-center bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative group">
      <svg ref={svgRef} width={width} height={height} className="bg-slate-50/30 cursor-move" />
      <div className="absolute bottom-2 right-2 text-[10px] text-slate-400 pointer-events-none">
        Logic Structure
      </div>
    </div>
  );
};
