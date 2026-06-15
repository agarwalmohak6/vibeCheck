<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent Behavior Rules
* **No Scratchpads**: Never create, open, write to, or read scratchpad files (e.g. `scratchpad.md`, checklists, or temporary files/notes). Do not initialize or reference any local scratchpad.
* **No Localhost Permission Asks**: Never ask the user for permission to read/execute localhost URLs or domain permissions. Assume access is either granted or handle any failure gracefully without prompting.
* **No Browser Preview**: Never launch the browser subagent or ask the user for a preview/verification in a browser. Verify correct functionality through server build checks, linting, and testing.



