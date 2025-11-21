
import React, { useEffect, useRef, useState } from 'react';
import * as d3Base from 'd3';
import { SimulationData } from '../types';
import { Play, RotateCcw, Zap, ZoomIn } from 'lucide-react';

const d3 = d3Base as any;

interface Props {
  data: SimulationData;
  width?: number; 
}

export const D3ScienceSimulator: React.FC<Props> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Logical ViewBox with padding
  const VB_X = -10;
  const VB_Y = -10;
  const VB_WIDTH = 120;
  const VB_HEIGHT = 80;

  useEffect(() => {
    setIsPlaying(false);
    drawScene();
  }, [data]);

  useEffect(() => {
    if (isPlaying) {
      runAnimation();
    } else {
      // If stopped, re-render to reset positions instantly
      drawScene();
    }
  }, [isPlaying]);

  const drawScene = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const defs = svg.append("defs");
    
    // Grid Pattern
    const pattern = defs.append("pattern")
      .attr("id", "sim-grid")
      .attr("width", 10)
      .attr("height", 10)
      .attr("patternUnits", "userSpaceOnUse");
    pattern.append("path")
      .attr("d", "M 10 0 L 0 0 0 10")
      .attr("fill", "none")
      .attr("stroke", "#e2e8f0") 
      .attr("stroke-width", 0.2);

    const container = svg.append("g").attr("class", "zoom-container");

    const zoom = d3.zoom()
      .scaleExtent([0.5, 5])
      .translateExtent([[-50, -50], [150, 150]])
      .on("zoom", (event: any) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom as any)
       .on("dblclick.zoom", null);

    container.append("rect")
      .attr("x", -100)
      .attr("y", -100)
      .attr("width", 300)
      .attr("height", 300)
      .attr("fill", "url(#sim-grid)");

    const elementsGroup = container.append("g").attr("id", "elements-layer");
    const trailLayer = container.insert("g", "#elements-layer").attr("class", "trails"); 
    const labelsGroup = container.append("g").attr("class", "labels-layer");

    const labelNodes: any[] = [];

    data.elements.forEach(el => {
      const g = elementsGroup.append("g").attr("id", `group-${el.id}`);
      
      if (el.type === 'path' && el.d) {
        g.append("path")
          .attr("id", el.id)
          .attr("d", el.d)
          .attr("fill", "none")
          .attr("stroke", el.color)
          .attr("stroke-width", 1.2)
          .attr("stroke-linecap", "round")
          .attr("vector-effect", "non-scaling-stroke");
      } else if (el.type === 'line') {
        g.append("line")
          .attr("id", el.id)
          .attr("x1", el.x || 0).attr("y1", el.y || 0)
          .attr("x2", el.x2 || 0).attr("y2", el.y2 || 0)
          .attr("stroke", el.color)
          .attr("stroke-width", 1.2)
          .attr("stroke-linecap", "round");
      } else if (el.type === 'rect') {
        g.append("rect")
          .attr("id", el.id)
          .attr("x", el.x || 0).attr("y", el.y || 0)
          .attr("width", el.width || 10).attr("height", el.height || 10)
          .attr("fill", el.color)
          .attr("fill-opacity", 0.1) 
          .attr("rx", 1)
          .attr("stroke", el.color)
          .attr("stroke-width", 1);
      } else if (el.type === 'circle') {
        g.append("circle")
          .attr("id", el.id)
          .attr("cx", el.x || 0).attr("cy", el.y || 0)
          .attr("r", el.r || 3)
          .attr("fill", el.color)
          .attr("stroke", "white")
          .attr("stroke-width", 1)
          .attr("shadow", "drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))");
      } else if (el.type === 'text') {
         labelNodes.push({
             id: el.id,
             text: el.label || "",
             x: el.x || 0,
             y: el.y || 0,
             color: el.color,
             isStandalone: true
         });
      }

      if (el.label && el.type !== 'text') {
        let lx = 0, ly = 0;
        if (el.type === 'circle') { 
            lx = (el.x||0); 
            ly = (el.y||0) - (el.r||0) - 3; 
        } else if (el.type === 'line') { 
            lx = ((el.x||0)+(el.x2||0))/2; 
            ly = ((el.y||0)+(el.y2||0))/2 - 2; 
        } else if (el.type === 'path') {
           const pathNode = g.select("path").node() as SVGPathElement;
           if (pathNode && pathNode.getPointAtLength) {
               const p = pathNode.getPointAtLength(0);
               lx = p.x;
               ly = p.y - 3;
           }
        } else if (el.type === 'rect') {
            lx = (el.x||0) + (el.width||0)/2;
            ly = (el.y||0) - 2;
        }

        labelNodes.push({
            id: `lbl-${el.id}`,
            text: el.label,
            x: lx,
            y: ly,
            targetX: lx, 
            targetY: ly,
            color: "#475569" 
        });
      }
    });

    const labels = labelsGroup.selectAll("text")
        .data(labelNodes)
        .enter()
        .append("text")
        .text((d: any) => d.text)
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y)
        .attr("font-size", 3.5)
        .attr("text-anchor", "middle")
        .attr("fill", (d: any) => d.color)
        .attr("font-family", "Inter, sans-serif")
        .attr("font-weight", "500")
        .style("pointer-events", "none")
        .style("paint-order", "stroke")
        .style("stroke", "white")
        .style("stroke-width", "0.8px")
        .style("stroke-linecap", "round")
        .style("stroke-linejoin", "round");

    labels.each(function(this: any, d: any) {
        const bbox = this.getBBox();
        d.width = bbox.width;
        d.height = bbox.height;
        d.r = Math.max(d.width, d.height) / 1.8; 
    });

    const simulation = d3.forceSimulation(labelNodes)
        .force("x", d3.forceX((d: any) => d.targetX || d.x).strength(0.5))
        .force("y", d3.forceY((d: any) => d.targetY || d.y).strength(0.5))
        .force("collide", d3.forceCollide((d: any) => d.r + 0.5).iterations(2)) 
        .stop();

    for (let i = 0; i < 120; ++i) simulation.tick();

    labels.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);

    labelsGroup.selectAll("line.connector")
        .data(labelNodes.filter((d: any) => !d.isStandalone && (Math.abs(d.x - d.targetX) > 2 || Math.abs(d.y - d.targetY) > 2)))
        .enter().insert("line", "text")
        .attr("x1", (d: any) => d.targetX)
        .attr("y1", (d: any) => d.targetY)
        .attr("x2", (d: any) => d.x)
        .attr("y2", (d: any) => d.y + (d.y < d.targetY ? 2 : -2))
        .attr("stroke", "#cbd5e1")
        .attr("stroke-width", 0.2);
  };

  const runAnimation = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const container = svg.select(".zoom-container");
    const trailLayer = container.select(".trails");

    data.animations.forEach(anim => {
      const target = container.select(`#${anim.targetId}`);
      if (target.empty()) return;

      // Resolve Easing
      let easingFn = d3.easeQuadInOut;
      if (anim.easing === 'linear') easingFn = d3.easeLinear;
      if (anim.easing === 'easeIn') easingFn = d3.easeQuadIn;
      if (anim.easing === 'easeOut') easingFn = d3.easeQuadOut;

      if (anim.action === 'moveAlongPath' && anim.pathId) {
        const pathElement = container.select(`#${anim.pathId}`).node() as SVGPathElement;
        if (pathElement && pathElement.getTotalLength) {
          const len = pathElement.getTotalLength();
          
          target.transition()
            .delay((anim.delay || 0) * 1000)
            .duration(anim.duration * 1000)
            .ease(easingFn)
            .attrTween("transform", function() {
              return function(t: number) {
                if (!pathElement.getPointAtLength) return "";
                const point = pathElement.getPointAtLength(t * len);
                
                // Trace Effect
                if (t > 0 && t < 1 && (t * 100) % 2 < 1) { 
                   trailLayer.append("circle")
                      .attr("cx", point.x)
                      .attr("cy", point.y)
                      .attr("r", 0.5)
                      .attr("fill", target.attr("fill") || "#94a3b8")
                      .attr("opacity", 0.5)
                      .transition().duration(1200).attr("opacity", 0).remove();
                }

                const isCircle = target.attr("cx") != null;
                if (isCircle) {
                    target.attr("cx", point.x).attr("cy", point.y);
                    return ""; 
                }
                return `translate(${point.x}, ${point.y})`; 
              };
            });
        }
      } else if (anim.action === 'moveTo') {
         target.transition()
            .delay((anim.delay || 0) * 1000)
            .duration(anim.duration * 1000)
            .ease(easingFn)
            .attr("cx", anim.toX)
            .attr("cy", anim.toY);
      }
    });
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
       <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50/80 to-white">
         <div>
           <div className="flex items-center gap-2 text-indigo-600 mb-1">
             <Zap size={18} fill="currentColor" className="text-indigo-500" />
             <h3 className="font-bold text-lg tracking-tight text-slate-800">{data.title || 'Core Concept Simulation'}</h3>
           </div>
           <p className="text-sm text-slate-500">{data.description || 'Visualizing the core principle dynamically.'}</p>
         </div>
         
         <button
           onClick={() => setIsPlaying(!isPlaying)}
           className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm ${
             !isPlaying 
             ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md' 
             : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
           }`}
         >
           {!isPlaying ? <><Play size={16} fill="currentColor" /> 演示 (Start)</> : <><RotateCcw size={16} /> 重置 (Reset)</>}
         </button>
       </div>

       <div className="w-full bg-slate-50/30 p-4 flex justify-center relative group">
          <div className="w-full max-w-4xl aspect-[16/9] bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden relative">
             <svg 
               ref={svgRef} 
               viewBox={`${VB_X} ${VB_Y} ${VB_WIDTH} ${VB_HEIGHT}`} 
               className="w-full h-full cursor-move"
               preserveAspectRatio="xMidYMid meet"
             />
             
             <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] text-slate-400 bg-white/80 px-2 py-1 rounded-full border border-slate-100 shadow-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn size={12} />
                <span>Scroll to Zoom • Drag to Pan</span>
             </div>

             <div className="absolute bottom-3 left-4 flex flex-wrap gap-2 pointer-events-none">
                {data.elements.filter(e => e.label && (e.type === 'path' || e.type === 'line')).map(e => (
                   <div key={e.id} className="flex items-center gap-1.5 bg-white/95 backdrop-blur px-2.5 py-1 rounded-md text-[11px] font-medium shadow-sm border border-slate-100 text-slate-600">
                      <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: e.color }}></div>
                      <span>{e.label}</span>
                   </div>
                ))}
             </div>
          </div>
       </div>
    </div>
  );
};
