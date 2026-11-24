# karim-mods

Meine Mods für **Claude Code**: ein Krebs über der Textleiste, ein Chime, wenn Claude fertig ist, ein Files-Panel, ein Schutz gegen teure „kalte“ Nachrichten und ein Panel, das alle Mods verwaltet.

> Braucht **Claude Code**, am besten die Desktop-App. Mit anderen AIs (ChatGPT usw.) laufen die Mods nicht.

## Installieren

In Claude Code eingeben, eine Zeile nach der anderen:

```
/plugin marketplace add karimamin0318-prog/karim-mods
/plugin install mod-hub@karim-mods
/plugin install crab-buddy@karim-mods
/plugin install done-chime@karim-mods
/plugin install cache-tax@karim-mods
/plugin install live-files@karim-mods
/plugin install skins@karim-mods
```

Danach die App neu starten oder `/reload-plugins` eingeben. Wer nicht alles will, lässt die Zeilen der unerwünschten Mods einfach weg.

Im Terminal geht es auch ohne `/`:

```
claude plugin marketplace add karimamin0318-prog/karim-mods
claude plugin install crab-buddy@karim-mods
```

## Die Mods

| Mod | Was sie macht | Befehl |
|---|---|---|
| **mod-hub** | Ein Panel für alle Mods: Ansichten öffnen, Befehle ausführen, Mods ein- und ausschalten. | `/mods` oder **⚙ Mods** über der Textleiste |
| **crab-buddy** | Ein kleiner Claude-Krebs über der Textleiste: tippt am Laptop, während Claude arbeitet, und spielt herum (Gewichte, Jutsu, Klone, Ball, Tanzen, Nickerchen), wenn Claude nichts tut. | `/crab`, `/crab on\|off` |
| **done-chime** | Spielt einen Chime, wenn Claude eine längere Aufgabe fertig hat, und einen anderen, wenn Claude etwas fragt oder eine Erlaubnis braucht. | `/chime on\|off\|test\|<sekunden>` |
| **cache-tax** | Nach einer Stunde Pause wird der Prompt-Cache kalt, und die nächste Nachricht kostet viel mehr. Die Mod hält so eine Nachricht auf einer Karte mit Auswahl an (trotzdem senden, zusammenfassen, mit Notiz neu starten, abbrechen) und kann den Cache in Pausen warm halten. Fork von [Karan Bansals cache-tax](https://github.com/karanb192/cache-tax). | `/cache-tax`, `/keepwarm` |
| **live-files** | Ein Files-Panel für die Desktop-App: was Claude gerade macht, welche Dateien es angefasst hat, Git-Status und ein Live-Projektbaum. | `/files` |
| **skins** | Nicht von mir, sondern von [hellosverre](https://github.com/hellosverre/claude-skins). Wird direkt aus seinem Repo installiert. Themes, schönere Tool-Karten und das Band über der Textleiste mit Ringen für Context %, 5h- und 7d-Limit. | `/skin` |

crab-buddy und skins passen zusammen: crab-buddy schiebt die Ringe von skins enger zusammen, damit der Krebs daneben Platz hat.

## Updaten

Im Terminal:

```
claude plugin marketplace update karim-mods
claude plugin update crab-buddy@karim-mods
```

Die zweite Zeile für jede installierte Mod wiederholen, danach die App neu starten.

## Lizenz

MIT. cache-tax © Karan Bansal (siehe `cache-tax/LICENSE`), skins © hellosverre.
