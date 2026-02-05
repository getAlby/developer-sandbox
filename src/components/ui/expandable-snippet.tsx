import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check, Code2, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CodeHighlight, type CodeLanguage } from '@/components/ui/code-highlight';
import { useUIStore } from '@/stores';
import { cn } from '@/lib/utils';

interface ExpandableSnippetProps {
  code: string;
  title?: string;
  language?: CodeLanguage;
  defaultExpanded?: boolean;
  variant?: 'inline' | 'card';
  className?: string;
}

export function ExpandableSnippet({
  code,
  title,
  language,
  defaultExpanded = false,
  variant = 'inline',
  className,
}: ExpandableSnippetProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);
  const { openCodeSnippetsHelp } = useUIStore();

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleHelp = (e: React.MouseEvent) => {
    e.stopPropagation();
    openCodeSnippetsHelp();
  };

  if (variant === 'inline') {
    return (
      <div className={cn('mt-1', className)}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          <Code2 className="h-3 w-3" />
          <span>{title || 'Show code'}</span>
        </button>

        {isExpanded && (
          <div className="mt-2 relative">
            <div className="bg-muted/50 border rounded-md p-3 pr-16 overflow-x-auto">
              <CodeHighlight code={code} language={language} />
            </div>
            <div className="absolute top-1 right-1 flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleHelp}
                title="View more code examples"
              >
                <HelpCircle className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleCopy}
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Card variant for the Code Snippets tab
  return (
    <div className={cn('border rounded-lg', className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full p-3 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-medium text-sm">{title}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-xs text-green-500">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </Button>
      </button>

      {isExpanded && (
        <div className="border-t px-3 pb-3">
          <div className="bg-muted/30 rounded-md p-3 overflow-x-auto mt-2">
            <CodeHighlight code={code} language={language} />
          </div>
        </div>
      )}
    </div>
  );
}

interface CodeBlockProps {
  code: string;
  language?: CodeLanguage;
  className?: string;
}

export function CodeBlock({ code, language, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <div className="bg-muted/50 border rounded-md p-3 overflow-x-auto">
        <CodeHighlight code={code} language={language} />
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-1 right-1 h-7 px-2"
        onClick={handleCopy}
      >
        {copied ? (
          <>
            <Check className="h-3 w-3 mr-1 text-green-500" />
            <span className="text-xs text-green-500">Copied</span>
          </>
        ) : (
          <>
            <Copy className="h-3 w-3 mr-1" />
            <span className="text-xs">Copy</span>
          </>
        )}
      </Button>
    </div>
  );
}
