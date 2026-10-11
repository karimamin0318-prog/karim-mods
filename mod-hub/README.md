# mod-hub

One panel for all your mods. Click **⚙ Mods** above the prompt box, or type `/mods`.

For every installed mod it shows:

- what it does, in one line
- **Open** buttons for its views (Files, Agents, Skin settings)
- buttons for its commands (cache-tax Preview / Size, Test chime, …); a command that needs more words goes into the prompt box for you to finish
- **Turn on / Turn off**: runs `claude plugin enable|disable`. It takes effect after you restart the app; the panel says so in orange.

The list is read when the panel opens (Refresh reads it again), so new mods show up by themselves. mod-hub never lists or switches itself.

## Changing it

Edit `hooks/register.ts` (the `BLURB`, `VIEWS` and `PRESETS` tables at the top set the words and buttons), bump `version` in `.claude-plugin/plugin.json`, then:

```
claude plugin test mod-hub
claude plugin marketplace update karim-mods
claude plugin update mod-hub@karim-mods
```
