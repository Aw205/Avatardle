import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map, Observable } from 'rxjs';
import { DataService } from './services/data.service';
import Rand from 'rand-seed';

interface PictureData {
  frame: string,
  names: string[],
  target: string
}

export const pictureResolver: ResolveFn<Observable<PictureData>> = (route, state) => {

  let http = inject(HttpClient);
  let ds = inject(DataService);

  let keys = Object.keys(ds.episodeData);
  let rand = new Rand(new Date().toLocaleDateString() + "picture");
  let targetEpisode: string = keys[Math.floor(keys.length * rand.next()) << 0];
  let frameIdx = rand.next() * targetEpisode.length << 0;
  let targetFrame = `randomframes/${ds.episodeData[targetEpisode][frameIdx]}`;

  return http.get(targetFrame, { responseType: "blob" }).pipe(
    map((blob) => {
      return { names: keys, target: targetEpisode, frame: URL.createObjectURL(blob) }
    })
  );
};
