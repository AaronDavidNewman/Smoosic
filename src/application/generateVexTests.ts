import { SuiApplication } from "./application";
import { SmoConfigurationParams } from "./configuration";
import { SmoToVex } from '../render/vex/toVex';
import { SuiXhrLoader } from '../ui/fileio/xhrLoader';
import { SmoScore } from '../smo/data/score';
export interface ScoreToRender {
  title: string, path: string, pages: number[]
}
const filesToRender: Record<string, ScoreToRender> = {
  'PreciousLord': { 
    title: 'PreciousLord', 
    path: 'https://aarondavidnewman.github.io/Smoosic/release/library/hymns/Precious Lord.json',
    pages: [0]
  }, 'BachWTC': {
    title: 'BachWTC',
    path: 'https://aarondavidnewman.github.io/Smoosic/release/library/piano/BachWTC-3.json',
    pages: [0, 1, 2]
  }, 'BachInvention': {
    title: 'BachInv1',
    path: 'https://aarondavidnewman.github.io/Smoosic/release/library/piano/BachInvention.json',
    pages: [1]
  }, 'Gnossienne3': {
    title: 'Gnossienne3',
    path: 'https://aarondavidnewman.github.io/Smoosic/release/library/piano/Gnossienne3-3.json',
    pages: [0, 1]
  }, 'GFWMessiah-I-2': {
    title: 'GFWMessiah-I-2',
    path: 'https://aarondavidnewman.github.io/Smoosic/release/library/messiah/Messiah-I-2.json',
    pages: [0, 1]
  }, 'Joplin': {
    title: 'Joplin',
    path: 'https://aarondavidnewman.github.io/Smoosic/release/library/piano/Joplin-Entertainer.json',
    pages: [0, 1, 2]
  }, 'Plena': {
    title: 'Plena',
    path: 'https://aarondavidnewman.github.io/Smoosic/release/library/bigband/Plena.json',
    pages: [2]
  }, 'Postillionlied': {
    title: 'Postillion Lied',
    path: 'https://aarondavidnewman.github.io/Smoosic/release/library/soprano/Postillionlied.json',
    pages: [0, 1, 2]
  }, 'Solovey': {
    title: 'Solovey',
    path: 'https://aarondavidnewman.github.io/Smoosic/release/library/soprano/Solovey.json',
    pages: [0, 1]
  }, 'Bilongo': {
    title: 'Bilongo',
    path: 'https://aarondavidnewman.github.io/Smoosic/release/library/bigband/Bilongo-Mandinga.json',
    pages: [7]
  }, 'Yama': {
    title: 'Yama',
    path: 'https://aarondavidnewman.github.io/Smoosic/release/library/Yama2.json',
    pages: [1]
  }
};
declare var $: any;
declare var JSZip: any;
const addFileLink = (filename: string, txt: any, parent: any, mimeType: string = 'application/octet-stream') => {
  var anchor = $('<a></a>');
  var url = URL.createObjectURL(new Blob([txt], { type: mimeType }));
  $(anchor).attr('href', url);
  $(anchor).attr('download', filename);
  $(anchor).text('save');
  $(parent).html('');
  $(parent).append(anchor);
}
export async function renderVexTests(config: Partial<SmoConfigurationParams>) {
  const zipName = 'output.zip';
  const zipFile = new JSZip();
  const application = await SuiApplication.configure(config);
  const view = application.view;
  if (!view) {
    return;
  }
  const fileKeys = Object.keys(filesToRender);
  for (var i = 0; i < fileKeys.length; ++i) {
    const fileInfo = filesToRender[fileKeys[i]];
    const path = fileInfo.path;
    const loader = new SuiXhrLoader(path);
    const scoreJson = await loader.loadAsync();
    const score = SmoScore.deserialize(scoreJson as string);  
    await view.changeScore(score);
    fileInfo.pages.forEach((page) => {
      const vexText = SmoToVex.convert(view.score, { div: 'smoo', page })
      const fileName = `${fileInfo.title}-${page}.js`;
      zipFile.file(fileName, vexText);  
    });
  }
  const blob = await zipFile.generateAsync({ type: 'blob' });
  const element = document.getElementById('remoteLink');
  addFileLink(zipName, blob, element);
  $('#remoteLink a')[0].click();
}