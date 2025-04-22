import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/core/components/card";

interface SummaryProps {
  title: string;
  summary: string;
}

const SummaryCard: React.FC<SummaryProps> = ({ title, summary }) => {
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
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
