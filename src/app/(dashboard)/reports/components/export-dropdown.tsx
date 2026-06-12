"use client";

import { Download, ChevronDown } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components";

interface ExportDropdownProps {
  onExportPdf: () => void;
  onExportExcel: () => void;
  isLoading?: boolean;
}

export function ExportDropdown({
  onExportPdf,
  onExportExcel,
  isLoading = false,
}: ExportDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={isLoading}
        >
          <Download className="h-3.5 w-3.5" />
          Export
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={onExportPdf} className="cursor-pointer">
          <span className="flex items-center gap-2 text-sm">
            📄 Export as PDF
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportExcel} className="cursor-pointer">
          <span className="flex items-center gap-2 text-sm">
            📊 Export as Excel
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
