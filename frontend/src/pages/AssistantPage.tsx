import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import {
  Send,
  Sparkles,
  Bot,
  User,
  AlertCircle
} from 'lucide-react';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  followups?: string[];
  timestamp: string;
}

const REFERENCE_QUICK_PROMPTS = [
  'What changed in my health?',
  'Why did my risk change?',
  'Compare my latest and previous screening',
  'What changed in my latest medical report?',
  'Has my glucose improved?',
  'What should I discuss with my doctor?',
];

function renderInlineFormatting(text: string) {
  if (!text) return '';
  const parts = String(text).split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return <strong key={i} className="font-bold text-[#172033]">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return <em key={i} className="italic text-[#172033]">{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function renderMarkdownLine(line: string, key: number | string) {
  const trimmed = line.trim();
  if (!trimmed) return <div key={key} className="h-1.5" />;

  // Heading 3: "### "
  if (trimmed.startsWith('### ')) {
    return (
      <div key={key} className="font-bold text-xs md:text-sm text-[#172033] mt-2.5 mb-1 text-slate-800">
        {renderInlineFormatting(trimmed.replace(/^###\s+/, ''))}
      </div>
    );
  }

  // Heading 2: "## "
  if (trimmed.startsWith('## ')) {
    return (
      <div key={key} className="font-bold text-sm text-[#172033] mt-3 mb-1.5 border-b border-[#E6EAF0] pb-1">
        {renderInlineFormatting(trimmed.replace(/^##\s+/, ''))}
      </div>
    );
  }

  // Blockquote: "> "
  if (trimmed.startsWith('> ')) {
    return (
      <div key={key} className="pl-3 py-1 my-1.5 border-l-2 border-[#1677FF] bg-blue-50/50 rounded-r text-[11px] md:text-xs text-[#172033] italic">
        {renderInlineFormatting(trimmed.replace(/^>\s*/, ''))}
      </div>
    );
  }

  // Numbered list items: "1. ", "2. "
  const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
  if (numMatch) {
    const num = numMatch[1];
    const rest = numMatch[2];
    return (
      <div key={key} className="flex items-start gap-2.5 my-1.5 pl-1">
        <span className="w-5 h-5 rounded-full bg-blue-100 text-[#1677FF] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
          {num}
        </span>
        <span className="leading-relaxed text-[#172033]">{renderInlineFormatting(rest)}</span>
      </div>
    );
  }

  // Bullet items: "• ", "- ", "* "
  const isSubBullet = line.startsWith('  ') || line.startsWith('\t');
  const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
  if (isBullet) {
    const clean = trimmed.replace(/^[•*-]\s*/, '');
    return (
      <div key={key} className={`flex items-start gap-2 my-1 ${isSubBullet ? 'pl-6' : 'pl-1'}`}>
        <span className={`rounded-full shrink-0 ${isSubBullet ? 'w-1 h-1 bg-[#667085] mt-2' : 'w-1.5 h-1.5 bg-[#1677FF] mt-1.5'}`} />
        <span className="leading-relaxed text-[#172033]">{renderInlineFormatting(clean)}</span>
      </div>
    );
  }

  return (
    <div key={key} className="leading-relaxed text-[#172033]">
      {renderInlineFormatting(trimmed)}
    </div>
  );
}

function renderMarkdownContent(content: string) {
  const lines = (content || '').split('\n');
  const elements: React.ReactNode[] = [];
  let tableBuffer: string[] = [];

  const flushTable = (keyIndex: number) => {
    if (tableBuffer.length === 0) return;
    const rawRows = tableBuffer.map((row) =>
      row
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell, idx, arr) => (idx > 0 && idx < arr.length - 1) || cell.length > 0)
    ).filter((r) => r.length > 0);

    const isDelimiter = (row: string[]) => row.every((c) => /^:?-+:?$/.test(c));

    let headerRow: string[] | null = null;
    let bodyRows: string[][] = [];

    if (rawRows.length >= 2 && isDelimiter(rawRows[1])) {
      headerRow = rawRows[0];
      bodyRows = rawRows.slice(2);
    } else {
      bodyRows = rawRows;
    }

    elements.push(
      <div key={`tbl-${keyIndex}`} className="my-2.5 overflow-x-auto rounded-lg border border-[#E6EAF0] shadow-2xs">
        <table className="w-full text-left border-collapse text-[11px] md:text-xs">
          {headerRow && (
            <thead className="bg-[#F7F9FC] border-b border-[#E6EAF0]">
              <tr>
                {headerRow.map((cell, cIdx) => (
                  <th key={cIdx} className="p-2 font-semibold text-[#172033]">
                    {renderInlineFormatting(cell)}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-[#E6EAF0]">
            {bodyRows.map((r, rIdx) => (
              <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-[#F7F9FC]/40' : 'bg-white'}>
                {r.map((cell, cIdx) => (
                  <td key={cIdx} className="p-2 text-[#172033]">
                    {renderInlineFormatting(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableBuffer = [];
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      tableBuffer.push(trimmed);
    } else {
      if (tableBuffer.length > 0) {
        flushTable(idx);
      }
      elements.push(renderMarkdownLine(line, idx));
    }
  });

  if (tableBuffer.length > 0) {
    flushTable(lines.length);
  }

  return elements;
}

export const AssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content:
        "Hello John! I'm your HealthAI Assistant. I analyze your centralized health records across screenings, laboratory reports, and vital trends to provide personalized, explainable insights. How can I assist you with your health today?",
      followups: [
        'What changed in my health?',
        'Why did my risk change?',
        'Compare my latest and previous screening',
        'What changed in my latest medical report?',
      ],
      timestamp: 'Just now',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: query,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.sender,
        content: m.content,
      }));

      const res = await api.chatWithAssistant(query, historyPayload);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        content: res.reply,
        followups: res.suggested_followups,
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const botErr: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        content:
          "I apologize, but I encountered a momentary connection issue. Please ensure your backend service is running and try again.",
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, botErr]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans">
      {/* Header Matching Screen 6 */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#172033]">
          AI Health Assistant
        </h1>
        <p className="text-sm text-[#667085] mt-1">
          Ask questions about your health, lab results, and wellness.
        </p>
      </div>

      {/* Suggested Quick Prompts Grid (Matching Screen 6) */}
      <div className="bg-white p-5 rounded-xl border border-[#E6EAF0] shadow-xs">
        <span className="text-xs font-bold text-[#172033] block mb-3">
          Suggested Topics
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {REFERENCE_QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="p-3 text-left bg-[#F7F9FC] border border-[#E6EAF0] hover:border-[#1677FF]/50 hover:bg-blue-50/40 rounded-xl text-xs font-medium text-[#172033] transition-all"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="bg-white rounded-xl border border-[#E6EAF0] shadow-xs overflow-hidden flex flex-col h-[520px]">
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-[#1677FF]" />
                  </div>
                )}

                <div className={`max-w-xl space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-4 rounded-2xl text-xs md:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-[#1677FF] text-white rounded-tr-xs shadow-2xs'
                        : 'bg-[#F7F9FC] border border-[#E6EAF0] text-[#172033] rounded-tl-xs'
                    }`}
                  >
                    {isUser ? (
                      msg.content
                    ) : (
                      <div className="space-y-1">
                        {renderMarkdownContent(msg.content)}
                      </div>
                    )}
                  </div>

                  {/* Follow-up suggestions */}
                  {!isUser && msg.followups && msg.followups.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 pl-1">
                      {msg.followups.map((f, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(f)}
                          className="px-2.5 py-1 bg-white border border-[#E6EAF0] hover:border-[#1677FF] text-[11px] font-medium text-[#1677FF] rounded-lg transition-colors"
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-[#667085] px-1 block">
                    {msg.timestamp}
                  </span>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-[#1677FF] text-white flex items-center justify-center shrink-0 text-xs font-bold">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-[#1677FF]" />
              </div>
              <div className="p-3 bg-[#F7F9FC] border border-[#E6EAF0] rounded-2xl rounded-tl-xs text-xs text-[#667085] flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#1677FF] animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-[#1677FF] animate-pulse delay-100" />
                <div className="w-2 h-2 rounded-full bg-[#1677FF] animate-pulse delay-200" />
                <span className="ml-1 font-medium">Analyzing health context...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar Matching Screen 6 */}
        <div className="p-4 border-t border-[#E6EAF0] bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your health question here..."
              className="flex-1 h-11 px-4 rounded-xl border border-[#E6EAF0] text-xs md:text-sm text-[#172033] bg-[#F7F9FC] focus:bg-white focus:outline-none focus:border-[#1677FF] transition-all"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="w-11 h-11 bg-[#1677FF] hover:bg-[#1366DB] disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-colors shrink-0 shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Safety Disclaimer */}
      <MedicalDisclaimer />
    </div>
  );
};
