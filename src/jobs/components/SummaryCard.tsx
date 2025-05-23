import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/core/components/card";
import { Button } from "@/core/components/button";

interface SummaryProps {
  title: string;
  summary: string;
  onRegenerate: () => void;
}

const SummaryCard: React.FC<SummaryProps> = ({
  title,
  summary,
  onRegenerate,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>

      <CardContent>
        {summary ? (
          <p className="text-gray-700 text-lg">{summary}</p>
        ) : (
          <p className="text-gray-500">No summary to display.</p>
        )}
        <Button className="w-auto mt-8" onClick={onRegenerate}>
          Regenerate Summary
        </Button>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
