import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface DocumentEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  showToolbar?: boolean;
}

export function DocumentEditor({ 
  content, 
  onChange, 
  placeholder = "Start typing...",
  showToolbar = true 
}: DocumentEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const handleInput = () => {
    if (editorRef.current) {
      isUpdatingRef.current = true;
      onChange(editorRef.current.innerHTML);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertText = (text: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    handleInput();
  };

  return (
    <div className="flex flex-col h-full">
      {showToolbar && (
        <div className="border-b border-border bg-card px-4 py-2 flex items-center space-x-1">
          <div className="flex items-center space-x-1 border-r border-border pr-3 mr-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => execCommand('bold')}
              className="p-2 hover:bg-muted"
              data-testid="button-bold"
            >
              <i className="fas fa-bold"></i>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => execCommand('italic')}
              className="p-2 hover:bg-muted"
              data-testid="button-italic"
            >
              <i className="fas fa-italic"></i>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => execCommand('underline')}
              className="p-2 hover:bg-muted"
              data-testid="button-underline"
            >
              <i className="fas fa-underline"></i>
            </Button>
          </div>
          
          <div className="flex items-center space-x-1 border-r border-border pr-3 mr-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => execCommand('insertUnorderedList')}
              className="p-2 hover:bg-muted"
              data-testid="button-bullet-list"
            >
              <i className="fas fa-list-ul"></i>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => execCommand('insertOrderedList')}
              className="p-2 hover:bg-muted"
              data-testid="button-number-list"
            >
              <i className="fas fa-list-ol"></i>
            </Button>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const url = prompt('Enter URL:');
                if (url) execCommand('createLink', url);
              }}
              className="p-2 hover:bg-muted"
              data-testid="button-link"
            >
              <i className="fas fa-link"></i>
            </Button>
          </div>
        </div>
      )}
      
      <div className="flex-1 p-8">
        <div 
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="min-h-full p-6 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-ring"
          style={{
            fontFamily: "'Times New Roman', serif",
            lineHeight: "1.6",
            fontSize: "16px"
          }}
          data-placeholder={placeholder}
          data-testid="editor-document"
        />
      </div>
    </div>
  );
}
