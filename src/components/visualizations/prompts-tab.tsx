import { useState } from 'react';
import {
  Play,
  Rocket,
  List,
  Copy,
  Check,
  MessageSquareText,
  Terminal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScenarioStore, useUIStore } from '@/stores';
import {
  PROMPT_CATEGORIES,
  getAllPrompts,
  type PromptCategory,
  type PromptWithScenario,
} from '@/data/prompts';
import type { ScenarioPrompt } from '@/types';
import { cn } from '@/lib/utils';

const CATEGORY_ICONS: Record<PromptCategory, React.ReactNode> = {
  'this-scenario': <Play className="h-4 w-4" />,
  'getting-started': <Rocket className="h-4 w-4" />,
  'all-scenarios': <List className="h-4 w-4" />,
};

const SKILL_COMMAND = 'npx skills add getAlby/alby-agent-skill';

function GettingStartedCard() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SKILL_COMMAND);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-muted/20">
      <div className="p-3">
        <h3 className="font-medium text-sm mb-1">Getting Started</h3>
        <p className="text-xs text-muted-foreground mb-2">
          Install the Alby agent skill in your project, then copy a prompt below into Claude Code or another AI tool.
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded-md px-3 py-1.5 font-mono text-xs">
            <Terminal className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span>{SKILL_COMMAND}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 flex-shrink-0"
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
      </div>
    </div>
  );
}

export function PromptsTab() {
  const { promptCategory, setPromptCategory } = useUIStore();
  const { currentScenario } = useScenarioStore();

  const isGettingStarted = promptCategory === 'getting-started';

  const prompts: (ScenarioPrompt | PromptWithScenario)[] =
    promptCategory === 'this-scenario'
      ? currentScenario.prompts ?? []
      : promptCategory === 'all-scenarios'
        ? getAllPrompts()
        : [];

  return (
    <div className="flex h-full flex-col sm:flex-row">
      {/* Category Sidebar */}
      <div className="border-b sm:border-b-0 sm:border-r flex-shrink-0 sm:w-48 overflow-x-auto sm:overflow-x-hidden sm:overflow-y-auto">
        <div className="flex sm:flex-col p-2 gap-1 sm:space-y-1 sm:gap-0">
          {PROMPT_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setPromptCategory(category.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left whitespace-nowrap flex-shrink-0',
                promptCategory === category.id
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {isGettingStarted ? (
          <GettingStartedCard />
        ) : prompts.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquareText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No prompts available for this scenario.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {prompts.map((prompt, index) => (
              <PromptCard
                key={index}
                prompt={prompt}
                showScenario={promptCategory === 'all-scenarios'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PromptCard({
  prompt,
  showScenario,
}: {
  prompt: ScenarioPrompt | PromptWithScenario;
  showScenario?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const scenarioInfo =
    showScenario && 'scenarioTitle' in prompt ? prompt : null;

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-2 p-3 bg-muted/30">
        <div className="min-w-0">
          {scenarioInfo && (
            <p className="text-xs text-muted-foreground mb-1">
              {scenarioInfo.scenarioIcon} {scenarioInfo.scenarioTitle}
            </p>
          )}
          <h3 className="font-medium text-sm">{prompt.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {prompt.description}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 flex-shrink-0"
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

      {/* Prompt Text */}
      <div className="p-3 bg-muted/10">
        <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap">
          {prompt.prompt}
        </pre>
      </div>
    </div>
  );
}
