import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface Props {
  filePath: string;
}

const components = {
  h1: (props: any) => <h1 {...props} className="text-3xl font-bold mb-6" />,
  h2: (props: any) => <h2 {...props} className="text-2xl font-semibold mt-8 mb-4" />,
  h3: (props: any) => <h3 {...props} className="text-xl font-semibold mt-6 mb-3" />,
  p: (props: any) => <p {...props} className="mb-4" />,
  ul: (props: any) => <ul {...props} className="list-disc pl-6 mb-4" />,
  ol: (props: any) => <ol {...props} className="list-decimal pl-6 mb-4" />,
  li: (props: any) => <li {...props} className="mb-2" />,
  strong: (props: any) => <strong {...props} className="font-semibold" />,
  em: (props: any) => <em {...props} className="italic" />,
};

export function MarkdownContent({ filePath }: Props) {
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch(filePath)
      .then((res) => res.text())
      .then(setContent)
      .catch((err) => console.error(`Error loading ${filePath}:`, err));
  }, [filePath]);

  if (!content) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="prose prose-slate">
        <ReactMarkdown components={components}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
