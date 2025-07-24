import { useState, useEffect } from 'react';
import { remark } from 'remark';
import remarkHtml from 'remark-html';
import remarkGfm from 'remark-gfm';

interface Props {
  filePath: string;
}

export function MarkdownContent({ filePath }: Props) {
  const [content, setContent] = useState('');

  useEffect(() => {
    const loadMarkdown = async () => {
      try {
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`Failed to load ${filePath}`);
        }
        
        const markdownText = await response.text();
        
        const processedContent = await remark()
          .use(remarkGfm)
          .use(remarkHtml)
          .process(markdownText);
          
        setContent(String(processedContent));
      } catch (error) {
        console.error('Error loading markdown:', error);
        setContent('<p>Error loading content</p>');
      }
    };

    loadMarkdown();
  }, [filePath]);

  return (
        <div className="prose prose-slate prose-ul:list-none text-justify" dangerouslySetInnerHTML={{ __html: content }} />
  );
}
