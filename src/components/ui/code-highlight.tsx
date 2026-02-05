import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/hljs/typescript';
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash';
import { github, atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useTheme } from '@/components/theme-provider';

SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('bash', bash);

export type CodeLanguage = 'javascript' | 'typescript' | 'bash';

interface CodeHighlightProps {
  code: string;
  language?: CodeLanguage;
}

export function CodeHighlight({ code, language = 'typescript' }: CodeHighlightProps) {
  const { isDark } = useTheme();

  return (
    <SyntaxHighlighter
      language={language}
      style={isDark ? atomOneDark : github}
      customStyle={{
        margin: 0,
        padding: 0,
        background: 'transparent',
        fontSize: '0.75rem',
      }}
      codeTagProps={{
        style: {
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        },
      }}
    >
      {code}
    </SyntaxHighlighter>
  );
}
