import { useState } from 'react';
import {
  Rocket,
  Info,
  Send,
  Receipt,
  AtSign,
  DollarSign,
  Code,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CODE_SNIPPETS,
  SNIPPET_CATEGORIES,
  type SnippetCategory,
  type CodeSnippet,
} from '@/data/code-snippets';
import { useUIStore } from '@/stores';
import { cn } from '@/lib/utils';

const CATEGORY_ICONS: Record<SnippetCategory, React.ReactNode> = {
  'getting-started': <Rocket className="h-4 w-4" />,
  basics: <Info className="h-4 w-4" />,
  payments: <Send className="h-4 w-4" />,
  invoices: <Receipt className="h-4 w-4" />,
  'lightning-address': <AtSign className="h-4 w-4" />,
  fiat: <DollarSign className="h-4 w-4" />,
  advanced: <Code className="h-4 w-4" />,
};

export function CodeSnippets() {
  const { snippetCategory, setSnippetCategory } = useUIStore();

  const filteredSnippets = CODE_SNIPPETS.filter(
    (snippet) => snippet.category === snippetCategory
  );

  return (
    <div className="flex h-full">
      {/* Category Sidebar */}
      <div className="w-48 border-r flex-shrink-0 overflow-y-auto">
        <div className="p-2 space-y-1">
          {SNIPPET_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setSnippetCategory(category.id)}
              className={cn(
                'flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-colors text-left',
                snippetCategory === category.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
            >
              {CATEGORY_ICONS[category.id]}
              <span>{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Snippets Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {filteredSnippets.map((snippet) => (
            <SnippetCard key={snippet.id} snippet={snippet} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SnippetCard({ snippet }: { snippet: CodeSnippet }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-muted/30">
        <div>
          <h3 className="font-medium text-sm">{snippet.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {snippet.description}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-xs">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </Button>
      </div>

      {/* Code Block */}
      <div className="p-3 bg-muted/10">
        <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap">
          <code>{snippet.code}</code>
        </pre>
      </div>
    </div>
  );
}
