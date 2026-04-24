import { Application, Container, Graphics, Text } from 'pixi.js';
import { Game } from './engine/game';
import { StatsBar } from './ui/statsBar';
import { SelectionPanel } from './ui/selectionPanel';
import almshouseScenario from './scenarios/almshouse-1841.json';
import almshouseMap from './maps/almshouse-small.json';
import type { Scenario } from './scenarios/types';
import type { MapData } from './maps/types';

const TEXT_COLOR = 0xe8e4dc;
const MUTED_COLOR = 0x9a9086;

async function boot() {
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  const app = new Application();
  await app.init({
    canvas,
    resizeTo: window,
    background: '#1a1814',
    antialias: false,
    roundPixels: true,
  });

  const scenario = almshouseScenario as Scenario;
  const mapData = almshouseMap as MapData;

  const game = new Game({
    app,
    mapData,
    durationDays: scenario.durationDays,
    startingBudget: scenario.startingBudget,
    pawnCount: 7,
  });

  const hud = new Container();
  app.stage.addChild(hud);

  const title = new Text({
    text: `${scenario.title} — ${scenario.year}`,
    style: { fill: TEXT_COLOR, fontSize: 20, fontFamily: 'Georgia, serif' },
  });
  title.position.set(14, 10);
  hud.addChild(title);

  const subtitle = new Text({
    text: scenario.location,
    style: {
      fill: MUTED_COLOR,
      fontSize: 13,
      fontFamily: 'Georgia, serif',
      fontStyle: 'italic',
    },
  });
  subtitle.position.set(14, 36);
  hud.addChild(subtitle);

  const dayLine = new Text({
    text: '',
    style: { fill: TEXT_COLOR, fontSize: 14, fontFamily: 'Georgia, serif' },
  });
  dayLine.position.set(14, 62);
  hud.addChild(dayLine);

  const countdown = new Text({
    text: '',
    style: {
      fill: MUTED_COLOR,
      fontSize: 12,
      fontFamily: 'Georgia, serif',
      fontStyle: 'italic',
    },
  });
  countdown.position.set(14, 82);
  hud.addChild(countdown);

  const statsBar = new StatsBar(app, game);
  hud.addChild(statsBar.container);

  const selectionPanel = new SelectionPanel(app, game);
  hud.addChild(selectionPanel.container);

  const endBanner = new Container();
  endBanner.visible = false;
  hud.addChild(endBanner);

  const endBg = new Graphics();
  endBanner.addChild(endBg);

  const endTitle = new Text({
    text: 'Miss Dix has arrived.',
    style: { fill: TEXT_COLOR, fontSize: 28, fontFamily: 'Georgia, serif' },
  });
  endTitle.anchor.set(0.5);
  endBanner.addChild(endTitle);

  const endSub = new Text({
    text: 'The inspection will be presented in a later milestone.',
    style: {
      fill: MUTED_COLOR,
      fontSize: 14,
      fontFamily: 'Georgia, serif',
      fontStyle: 'italic',
    },
  });
  endSub.anchor.set(0.5);
  endBanner.addChild(endSub);

  const layoutEndBanner = () => {
    const cx = app.screen.width / 2;
    const cy = app.screen.height / 2;
    endTitle.position.set(cx, cy - 18);
    endSub.position.set(cx, cy + 18);
    endBg.clear();
    endBg.rect(0, cy - 70, app.screen.width, 140).fill({ color: 0x1a1410, alpha: 0.92 });
    endBg.rect(0, cy - 71, app.screen.width, 1).fill(0x3a322a);
    endBg.rect(0, cy + 70, app.screen.width, 1).fill(0x3a322a);
  };
  window.addEventListener('resize', () => {
    if (endBanner.visible) layoutEndBanner();
  });

  app.ticker.add(() => {
    const day = game.clock.dayWhole;
    const total = game.clock.durationDays;
    dayLine.text = `Day ${day} of ${total}`;
    const remaining = Math.ceil(game.clock.daysRemaining);
    countdown.text =
      remaining > 0
        ? `Miss Dix arrives in ${remaining} day${remaining === 1 ? '' : 's'}.`
        : 'Miss Dix has arrived.';

    if (game.clock.ended && !endBanner.visible) {
      endBanner.visible = true;
      layoutEndBanner();
    }
  });
}

boot().catch((err) => {
  console.error('Failed to boot:', err);
  document.body.innerHTML = `<pre style="color:#e8e4dc;padding:20px">Boot error: ${String(err)}</pre>`;
});
