---
name: demo-user-role
description: Example memory file — information about the user
metadata:
  type: user
---

This is a demo memory file. In a real project, your AI assistant writes files like this to remember things about you across conversations.

The frontmatter at the top (between `---` markers) is parsed by MDView and shown as a purple **type** badge in the sidebar. Try checking the sidebar — this file should show a `user` badge.

**Why memory files matter:** They let your assistant maintain context without you re-explaining things each session. The token count in the status bar tells you how expensive a file is to include in context.

**How to apply:** Keep memory files focused and accurate. Delete stale entries — dead context is just wasted tokens.
