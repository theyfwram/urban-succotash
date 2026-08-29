import React from "react";
import ReactMarkdown from "react-markdown";

// Renders a live preview of a Discord Components V2 ("Container V2") message.
const STYLE_BG = { primary: "bg-[#5865F2] text-white", secondary: "bg-[#4e5058] text-white", success: "bg-[#248046] text-white", danger: "bg-[#da373c] text-white", link: "bg-[#4e5058] text-white" };

export default function ContainerV2Preview({ template, vars = {} }) {
  if (!template) return null;
  const fill = (s) => String(s ?? "").replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
  const color = template.color ?? 5814273;
  const hex = "#" + color.toString(16).padStart(6, "0");

  return (
    <div className="rounded-lg overflow-hidden border border-border bg-[#313338] text-[#dbdee1] font-body text-sm max-w-md">
      <div className="p-4" style={{ borderLeft: `4px solid ${hex}` }}>
        {(template.emoji || template.title) && (
          <div className="font-semibold text-base mb-2 flex items-center gap-2">
            {template.emoji && <span>{template.emoji}</span>}
            {template.title && <span>{fill(template.title)}</span>}