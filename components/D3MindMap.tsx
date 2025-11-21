import React, { useEffect, useRef } from 'react';
import * as d3Base from 'd3';
import { VisualData } from '../types';

const d3 = d3Base as any;

interface Props {
  data: VisualData;
  width?: number;
  height?: number;
}

export const D3MindMap: React.FC<Props> = ({ data, width = 800, height = 500 }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    // SCI Color Palette
    const colors = {
      root: { fill: "#1e3a8a", stroke: "#172554", text: "#ffffff" }, // Deep Navy
      branch: { fill: "#0e7490", stroke: "#155e75", text: "#ffffff" }, // Muted Teal
      leaf: { fill: "#f8fafc", stroke: "#94a3b8", text: "#334155" },   // Clean White/Grey
      link: "#94a3b8"
    };

    // Create a container group for zooming
    const g = svg.append("g");

    // Zoom Behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event: any) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const nodes = data.nodes.map((d: any) => ({ ...d }));
    const links = data.links.map((d: any) => ({ ...d }));

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(50));

    // Arrow marker - refined style
    svg.append("defs").selectAll("marker")
      .data(["end"])
      .enter().append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 28) // Adjusted for node size
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", colors.link)
      .attr("d", "M0,-5L10,0L0,5");

    const link = g.append("g")
      .attr("stroke", colors.link)
      .attr("stroke-opacity", 0.8)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow)");

    const linkText = g.append("g")
      .selectAll("text")
      .data(links)
      .join("text")
      .attr("dy", -5)
      .attr("font-size", "10px")
      .attr("fill", "#64748b")
      .attr("text-anchor", "middle")
      .style("font-family", "sans-serif")
      .text((d: any) => d.label || "");

    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "grab")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Node Circles
    node.append("circle")
      .attr("r", (d: any) => d.group === 1 ? 35 : (d.group === 2 ? 25 : 18))
      .attr("fill", (d: any) => d.group === 1 ? colors.root.fill : (d.group === 2 ? colors.branch.fill : colors.leaf.fill))
      .attr("stroke", (d: any) => d.group === 1 ? colors.root.stroke : (d.group === 2 ? colors.branch.stroke : colors.leaf.stroke))
      .attr("stroke-width", 2)
      .attr("shadow", "drop-shadow(0px 2px 3px rgba(0,0,0,0.1))");

    // Labels
    node.append("text")
      .text((d: any) => d.label)
      .attr("x", 0)
      .attr("y", 0)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("font-size", (d: any) => d.group === 1 ? "13px" : "11px")
      .attr("fill", (d: any) => d.group === 1 ? colors.root.text : (d.group === 2 ? colors.branch.text : colors.leaf.text))
      .style("font-weight", (d: any) => d.group === 3 ? "500" : "600")
      .style("pointer-events", "none")
      .style("font-family", "'Inter', sans-serif")
      .call(getWrapText);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      linkText
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
      d3.select(event.sourceEvent.target).attr("cursor", "grabbing");
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
      d3.select(event.sourceEvent.target).attr("cursor", "grab");
    }

    function getWrapText(text: any) {
      text.each(function(this: any, d: any) {
        // For circle nodes, wrap tighter
        const r = d.group === 1 ? 35 : (d.group === 2 ? 25 : 18);
        const width = r * 1.8;
        const text = d3.select(this);
        // Simple check to clear previous text if calling multiple times, though here we append once
        // However, we want to center it vertically based on lines. 
        // Since we can't easily pre-calc lines, we render first.
        
        const words = text.text().split(/\s+/).reverse();
        let word;
        let line: any[] = [];
        let lineNumber = 0;
        const lineHeight = 1.1; // ems
        const y = text.attr("y");
        
        // Clear text content to rebuild with tspans
        text.text(null);
        
        let tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", 0);
        
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if ((tspan.node()?.getComputedTextLength() || 0) > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + "em").text(word);
          }
        }
        // Recenter vertically
        const totalHeight = (lineNumber + 1) * lineHeight;
        text.selectAll("tspan").attr("dy", function(this: any, d: any, i: number) {
           return (i - lineNumber / 2) * 1.1 + 0.35 + "em";
        });
      });
    }

  }, [data, width, height]);

  return (
    <div className="w-full flex justify-center items-center bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200 relative group">
      <svg ref={svgRef} width={width} height={height} className="bg-slate-50/30 cursor-move" />
      <div className="absolute bottom-2 right-2 text-[10px] text-slate-400 bg-white/80 px-2 py-1 rounded pointer-events-none border border-slate-100">
        Scroll to Zoom • Drag to Pan
      </div>
    </div>
  );
};