
import React, { useEffect, useRef } from 'react';
import * as d3Base from 'd3';
import { VisualData } from '../types';

const d3 = d3Base as any;

interface Props {
  data: VisualData;
  width?: number;
  height?: number;
}

export const D3AnimatedFlow: React.FC<Props> = ({ data, width = 800, height = 400 }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // SCI Academic Color Palette
    const colors = {
      background: "#f8fafc",
      input: { fill: "#e0f2fe", stroke: "#0284c7", text: "#0c4a6e" },   // Light Blue (Variables)
      process: { fill: "#fef3c7", stroke: "#d97706", text: "#78350f" }, // Amber (Logic/Operator)
      output: { fill: "#dcfce7", stroke: "#16a34a", text: "#14532d" },  // Green (Result)
      link: "#94a3b8",
      particle: "#f59e0b" // Energy/Data flow color (Amber/Orange)
    };

    // Arrow Marker
    svg.append("defs").append("marker")
      .attr("id", "arrow-flow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20) // Offset to not overlap node
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", colors.link)
      .attr("d", "M0,-5L10,0L0,5");

    const g = svg.append("g");

    // Zoom Behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on("zoom", (event: any) => g.attr("transform", event.transform));
    svg.call(zoom);

    // Prepare Data
    const nodes = data.nodes.map(d => ({ ...d }));
    const links = data.links.map(d => ({ ...d }));

    // Left-to-Right Positioning Logic based on Group
    // Group 1: Inputs (Left), Group 2: Process (Center), Group 3: Output (Right)
    const xPos = (group: number | undefined) => {
      if (group === 1) return width * 0.15;
      if (group === 3) return width * 0.85;
      return width * 0.5; // Default/Group 2
    };

    // Force Simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).strength(0.5))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("collide", d3.forceCollide(60))
      .force("x", d3.forceX((d: any) => xPos(d.group)).strength(1)) // Strong pull to X layout
      .force("y", d3.forceY(height / 2).strength(0.1)); // Weak pull to center Y

    // Links
    const link = g.append("g")
      .selectAll("path")
      .data(links)
      .enter().append("path")
      .attr("fill", "none")
      .attr("stroke", colors.link)
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrow-flow)");

    // Nodes Group
    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .enter().append("g")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // --- Shape Logic based on Group ---
    
    // Group 1: Inputs (Circles/Variables)
    node.filter((d: any) => d.group === 1)
      .append("circle")
      .attr("r", 30)
      .attr("fill", colors.input.fill)
      .attr("stroke", colors.input.stroke)
      .attr("stroke-width", 2);

    // Group 2: Process (Diamonds/Logic)
    node.filter((d: any) => !d.group || d.group === 2)
      .append("rect")
      .attr("width", 50)
      .attr("height", 50)
      .attr("x", -25) // Center
      .attr("y", -25)
      .attr("transform", "rotate(45)") // Diamond shape
      .attr("rx", 4)
      .attr("fill", colors.process.fill)
      .attr("stroke", colors.process.stroke)
      .attr("stroke-width", 2);

    // Group 3: Output (Rounded Rects/Result)
    node.filter((d: any) => d.group === 3)
      .append("rect")
      .attr("width", 100)
      .attr("height", 50)
      .attr("x", -50)
      .attr("y", -25)
      .attr("rx", 10)
      .attr("fill", colors.output.fill)
      .attr("stroke", colors.output.stroke)
      .attr("stroke-width", 2);

    // Labels
    node.append("text")
      .text((d: any) => d.label)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .attr("font-family", "'Inter', sans-serif")
      .attr("fill", (d: any) => {
         if (d.group === 1) return colors.input.text;
         if (d.group === 3) return colors.output.text;
         return colors.process.text;
      })
      .style("pointer-events", "none")
      .each(function(this: any, d: any) {
        // Wrap text slightly if needed
        const width = d.group === 3 ? 90 : 40;
        const self = d3.select(this);
        if (self.node().getComputedTextLength() > width) {
             const words = self.text().split(" ");
             if (words.length > 1) {
                 self.text(null);
                 self.append("tspan").attr("x", 0).attr("dy", "-0.5em").text(words[0]);
                 self.append("tspan").attr("x", 0).attr("dy", "1.1em").text(words.slice(1).join(" "));
             }
        }
      });


    // Simulation Tick
    simulation.on("tick", () => {
      // Update Link Paths (Curved for flow)
      link.attr("d", (d: any) => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 2; // Less curve
        return `M${d.source.x},${d.source.y}C${(d.source.x + d.target.x)/2},${d.source.y} ${(d.source.x + d.target.x)/2},${d.target.y} ${d.target.x},${d.target.y}`;
      });

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // --- Animation: Glowing Energy Packets ---
    const particles = g.append("g").attr("class", "particles");
    
    // Continually add particles
    const particleInterval = setInterval(() => {
        if (document.hidden) return; // Pause if tab hidden
        
        // Only animate if links exist
        if (links.length === 0) return;

        // Select a random link or all links
        links.forEach((l: any, i: number) => {
            // Only spawn periodically
            if (Math.random() > 0.3) return;

            const pathNode = link.nodes()[i];
            if (!pathNode) return;

            const p = particles.append("circle")
                .attr("r", 4)
                .attr("fill", colors.particle)
                .attr("filter", "drop-shadow(0 0 4px rgba(245, 158, 11, 0.8))"); // Glow effect

            p.transition()
                .duration(1500 + Math.random() * 500)
                .ease(d3.easeQuadInOut)
                .attrTween("transform", function() {
                   return function(t: number) {
                      try {
                        const point = pathNode.getPointAtLength(t * pathNode.getTotalLength());
                        return `translate(${point.x},${point.y})`;
                      } catch (e) { return "translate(0,0)"; }
                   };
                })
                .on("end", function() { d3.select(this).remove(); });
        });

    }, 800);

    return () => clearInterval(particleInterval);

    // Drag Functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

  }, [data, width, height]);

  return (
    <div className="w-full flex flex-col items-center bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative group">
      <div className="w-full h-10 bg-slate-50 border-b border-slate-100 flex items-center justify-between px-4 text-xs text-slate-500">
         <div className="flex gap-4">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#0284c7]"></div>Variable (Input)</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rotate-45 bg-[#d97706]"></div>Logic (Process)</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-[#16a34a]"></div>Result (Output)</div>
         </div>
         <div>Formula Logic View</div>
      </div>
      <svg ref={svgRef} width={width} height={height} className="bg-slate-50/30 cursor-move" />
    </div>
  );
};
