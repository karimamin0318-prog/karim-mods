# cache-tax (Karim's version)

A fork of [Karan Bansal's cache-tax](https://github.com/karanb192/cache-tax) 2.2.1 (MIT, see `LICENSE`).

After an hour without a message, Claude's prompt cache goes cold and the next message has to re-read the whole chat, which costs much more. This mod:

- **Holds a cold message on a card** above the prompt box, showing what sending now costs against a warm turn. Then you pick one of four choices, by clicking or with keys 1–4 in an empty prompt box:
  1. **Send anyway** (red, most expensive): keeps the whole chat.
  2. **Summarize** (orange): runs `/compact`, then sends your message.
  3. **Clear with a note** (green, cheapest): asks "Are you sure?" first. A cheap model (Haiku) then writes a handoff note, the chat is cleared, and the new chat starts with the note and your message. If the note can't be written, nothing is cleared.
  4. **Cancel** (grey): puts your message back in the prompt box.
- **Keeps the cache warm during breaks** with `/keepwarm`. This part is unchanged from the original.

## Commands

```
/cache-tax                    status card
/cache-tax preview            show the hold card (the choices only say what they would do)
/cache-tax size small|medium|large   small is the default; bigger sizes may need scrolling
/cache-tax guard warn|refuse  refuse = hold on the card (default), warn = only show the price
/keepwarm [6h | 90m | always | off | status]
```

## Changing it

Edit the files here, bump `version` in `.claude-plugin/plugin.json`, then:

```
claude plugin test .
claude plugin marketplace update karim-mods
claude plugin update cache-tax@karim-mods
```

Restart the app, or run `/reload-plugins`.
