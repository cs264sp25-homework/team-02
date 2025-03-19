import { Button } from "@/core/components/button";
import { Input } from "@/core/components/input";
import { Label } from "@/core/components/label";

export default function AddFile() {
  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="file">Upload Document (PDF or DOCX)</Label>
        <Input
          id="file"
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="cursor-pointer"
        />
      </div>

      <Button onClick={() => {}} className="w-full">
        Upload File
      </Button>
    </div>
  );
}
