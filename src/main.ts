import { Application, Text } from 'pixi.js';
import { Game } from './engine/game';
import almshouseScenario from './scenarios/almshouse-1841.json';
import almshouseMap from './maps/almshouse-small.json';
import type { Scenario } from './scenarios/types';
import type { MapData } from './maps/types';

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

  new Game({ app, mapData, pawnCount: 5 });

  const title = new Text({
    text: `${scenario.title} — ${scenario.year}`,
    style: { fill: 0xe8e4dc, fontSize: 20, fontFamily: 'Georgia, serif' },
  });
  title.position.set(14, 10);
  app.stage.addChild(title);

  const subtitle = new Text({
    text: scenario.location,
    style: {
      fill: 0x9a9086,
      fontSize: 13,
      fontFamily: 'Georgia, serif',
      fontStyle: 'italic',
    },
  });
  subtitle.position.set(14, 36);
  app.stage.addChild(subtitle);
}

boot().catch((err) => {
  console.error('Failed to boot:', err);
  document.body.innerHTML = `<pre style="color:#e8e4dc;padding:20px">Boot error: ${String(err)}</pre>`;
});
