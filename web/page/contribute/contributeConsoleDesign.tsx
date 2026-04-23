import React, { useState, useRef, useEffect } from 'react';
import Button from 'component/button';
import {
  CONTRIBUTION_TITLE,
  CONTRIBUTION_INTRO,
  CONTRIBUTION_BODY,
  WHY_POINTS,
  TRACKS,
  PROCESS_STEPS,
  QUALITY_NOTE,
  REPOSITORIES,
} from './content';
const TRACK_SLUGS = {};
TRACKS.forEach((track) => {
  TRACK_SLUGS[track.title.toLowerCase().replace(/\s+&?\s*/g, '-')] = track;
});
const REPO_SLUGS = {};
REPOSITORIES.forEach((repo) => {
  REPO_SLUGS[repo.shortLabel.toLowerCase().replace(/\s+/g, '-')] = repo;
});
const HELP_LINES = [
  'Available commands:',
  '',
  '  help             Show this message',
  '  about            About this page',
  '  why              Why contribute?',
  '  tracks           List contribution tracks',
  '  show <track>     Details for a track (e.g. show tv-apps)',
  '  steps            How the process works',
  '  repos            GitHub repositories',
  '  open <repo>      Open a repo (e.g. open frontend)',
  '  links            Quick links',
  '  clear            Clear output',
];

function runCommand(rawInput) {
  const input = rawInput.trim().toLowerCase();
  const parts = input.split(/\s+/);
  const cmd = parts[0];
  const arg = parts.slice(1).join('-');
  if (!cmd) return null;

  switch (cmd) {
    case 'help':
    case '?':
      return HELP_LINES.map((line) =>
        line === ''
          ? {
              type: 'blank',
            }
          : {
              type: 'text',
              value: line,
            }
      );

    case 'about':
      return [
        {
          type: 'heading',
          value: CONTRIBUTION_TITLE,
        },
        {
          type: 'text',
          value: CONTRIBUTION_INTRO,
        },
        {
          type: 'text',
          value: CONTRIBUTION_BODY,
        },
      ];

    case 'why':
      return WHY_POINTS.map((point) => ({
        type: 'quote',
        value: point,
      }));

    case 'tracks':
      return [
        ...TRACKS.map((track) => ({
          type: 'text',
          value: `  ${track.title.toLowerCase().replace(/\s+&?\s*/g, '-')}/  -  ${track.summary}`,
        })),
        {
          type: 'blank',
        },
        {
          type: 'hint',
          value: 'Use "show <name>" for details, e.g. show tv-apps',
        },
      ];

    case 'show': {
      if (!arg)
        return [
          {
            type: 'error',
            value: 'Usage: show <track-name>. Try "tracks" first.',
          },
        ];
      const track = TRACK_SLUGS[arg];

      if (!track) {
        return [
          {
            type: 'error',
            value: `Unknown track "${arg}". Available: ${Object.keys(TRACK_SLUGS).join(', ')}`,
          },
        ];
      }

      return [
        {
          type: 'heading',
          value: track.title,
        },
        {
          type: 'text',
          value: track.summary,
        },
        ...track.items.map((item) => ({
          type: 'text',
          value: `  - ${item}`,
        })),
      ];
    }

    case 'steps':
    case 'process':
    case 'how':
      return [
        ...PROCESS_STEPS.map((step, index) => ({
          type: 'text',
          value: `  ${index + 1}. ${step}`,
        })),
        {
          type: 'blank',
        },
        {
          type: 'hint',
          value: QUALITY_NOTE,
        },
      ];

    case 'repos':
      return [
        ...REPOSITORIES.map((repo) => ({
          type: 'link',
          value: `  ${repo.shortLabel.padEnd(18)} ${repo.label}`,
          href: repo.href,
        })),
        {
          type: 'blank',
        },
        {
          type: 'hint',
          value: 'Use "open <name>" to visit, e.g. open frontend',
        },
      ];

    case 'open': {
      if (!arg)
        return [
          {
            type: 'error',
            value: 'Usage: open <repo>. Try "repos" first.',
          },
        ];
      const repo = REPO_SLUGS[arg];

      if (!repo) {
        return [
          {
            type: 'error',
            value: `Unknown repo "${arg}". Available: ${Object.keys(REPO_SLUGS).join(', ')}`,
          },
        ];
      }

      if (typeof window !== 'undefined') window.open(repo.href, '_blank');
      return [
        {
          type: 'text',
          value: `Opening ${repo.label}...`,
        },
      ];
    }

    case 'links':
      return [
        {
          type: 'link',
          value: '  GitHub - Help Wanted issues',
          href: REPOSITORIES[0].href,
        },
        {
          type: 'link',
          value: '  Discord - Chat with contributors',
          href: 'https://chat.odysee.com',
        },
        {
          type: 'link',
          value: '  llms.txt - Architecture docs for AI agents',
          href: 'https://llms.odysee.com',
        },
      ];

    case 'clear':
      return 'CLEAR';

    default:
      return [
        {
          type: 'error',
          value: `command not found: ${cmd}`,
        },
        {
          type: 'hint',
          value: 'Type "help" for available commands.',
        },
      ];
  }
}

const ContributeConsoleDesign = () => {
  const [entries, setEntries] = useState([]);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef(null);
  const endRef = useRef(null);
  useEffect(() => {
    if (endRef.current)
      endRef.current.scrollIntoView({
        behavior: 'smooth',
      });
  }, [entries]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const raw = input.trim();
    if (!raw) return;
    setCommandHistory((prev) => [raw, ...prev]);
    setHistoryIndex(-1);

    if (raw.toLowerCase() === 'clear') {
      setEntries([]);
      setInput('');
      return;
    }

    const output = runCommand(raw);

    if (output && output !== 'CLEAR') {
      setEntries((prev) => [
        ...prev,
        {
          cmd: raw,
          lines: output,
        },
      ]);
    }

    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(historyIndex + 1, commandHistory.length - 1);
      setHistoryIndex(next);
      if (commandHistory[next]) setInput(commandHistory[next]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = historyIndex - 1;

      if (next < 0) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(next);
        setInput(commandHistory[next] || '');
      }
    }
  };

  return (
    <div className="contribute-container contribute-console-design">
      <div className="a43-screen">
        <div className="a43-line a43-prompt">
          <span className="a43-caret">$</span>
          <span className="a43-cmd">cat welcome.md</span>
        </div>
        <h1 className="a43-title">{CONTRIBUTION_TITLE}</h1>
        <p className="a43-text">{CONTRIBUTION_INTRO}</p>
        <p className="a43-text">{CONTRIBUTION_BODY}</p>

        <div className="a43-actions">
          <Button button="primary" label='Find "Help Wanted"' href={REPOSITORIES[0].href} />
          <Button button="alt" label="Join Discord" href="https://chat.odysee.com" />
          <Button button="link" label="Read llms.txt" href="https://llms.odysee.com" />
        </div>

        <div className="a43-line a43-prompt">
          <span className="a43-caret">$</span>
          <span className="a43-cmd">cat why.md</span>
        </div>
        {WHY_POINTS.map((point) => (
          <p key={point} className="a43-text a43-quote">
            {'> '}
            {point}
          </p>
        ))}

        <div className="a43-line a43-prompt">
          <span className="a43-caret">$</span>
          <span className="a43-cmd">ls ./tracks/</span>
        </div>
        <div className="a43-track-list">
          {TRACKS.map((track) => (
            <div key={track.title} className="a43-track-entry">
              <span className="a43-dir">{track.title.toLowerCase().replace(/\s+/g, '-')}/</span>
              <span className="a43-desc"> - {track.summary}</span>
              <ul className="a43-items">
                {track.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="a43-line a43-prompt">
          <span className="a43-caret">$</span>
          <span className="a43-cmd">cat CONTRIBUTING.md</span>
        </div>
        <div className="a43-steps-block">
          {PROCESS_STEPS.map((step, index) => (
            <p key={step} className="a43-text">
              <span className="a43-num">{index + 1}.</span> {step}
            </p>
          ))}
        </div>
        <p className="a43-text a43-note">{QUALITY_NOTE}</p>

        <div className="a43-line a43-prompt">
          <span className="a43-caret">$</span>
          <span className="a43-cmd">cat repos.json | jq '.[]'</span>
        </div>
        <div className="a43-repos">
          {REPOSITORIES.map((repo) => (
            <a key={repo.label} href={repo.href} className="a43-repo">
              {'{ '}
              <span className="a43-key">"name"</span>: <span className="a43-val">"{repo.shortLabel}"</span>
              {' }'}
            </a>
          ))}
        </div>

        <div className="a43-divider" />
        <p className="a43-interactive-hint">
          Try it yourself - type <strong>help</strong>, <strong>tracks</strong>, <strong>repos</strong>, or{' '}
          <strong>open frontend</strong>
        </p>

        {entries.map((entry, i) => (
          <div key={i} className="a43-entry">
            <div className="a43-line a43-prompt">
              <span className="a43-caret">$</span>
              <span className="a43-cmd">{entry.cmd}</span>
            </div>
            <div className="a43-output">
              {entry.lines.map((line, j) => {
                if (line.type === 'blank') {
                  return <div key={j} className="a43-blank" />;
                }

                if (line.type === 'heading') {
                  return (
                    <p key={j} className="a43-out-heading">
                      {line.value}
                    </p>
                  );
                }

                if (line.type === 'quote') {
                  return (
                    <p key={j} className="a43-text a43-quote">
                      {'> '}
                      {line.value}
                    </p>
                  );
                }

                if (line.type === 'link') {
                  return (
                    <a key={j} className="a43-out-link" href={line.href} target="_blank" rel="noopener noreferrer">
                      {line.value}
                    </a>
                  );
                }

                if (line.type === 'error') {
                  return (
                    <p key={j} className="a43-out-error">
                      {line.value}
                    </p>
                  );
                }

                if (line.type === 'hint') {
                  return (
                    <p key={j} className="a43-out-hint">
                      {line.value}
                    </p>
                  );
                }

                return (
                  <p key={j} className="a43-out-text">
                    {line.value}
                  </p>
                );
              })}
            </div>
          </div>
        ))}

        <form className="a43-input-row" onSubmit={handleSubmit}>
          <span className="a43-caret">$</span>
          <input
            ref={inputRef}
            type="text"
            className="a43-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="type a command..."
            spellCheck={false}
            autoComplete="off"
          />
        </form>
        <div ref={endRef} />
      </div>
    </div>
  );
};

export default ContributeConsoleDesign;
