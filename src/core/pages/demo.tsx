import { api } from "../../../convex/_generated/api";
import { Button } from "../components/button";
import { useQuery } from "convex/react";
import { useState } from "react";

function Demo() {
  const [showMessage, setShowMessage] = useState(false);
  const message = useQuery(api.hello.greet, {
    name: " world",
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-svh">
      <Button
        variant={showMessage ? "outline" : "default"}
        onClick={() => setShowMessage(!showMessage)}
      >
        {`Click to ${showMessage ? "hide" : "show"} a message from the backend`}
      </Button>
      {showMessage && (
        <div className="m-2">
          Backend says:{" "}
          <code className="border px-2 py-1 rounded-md text-sm">{message}</code>
        </div>
      )}
    </div>
  );
}

export default Demo;
