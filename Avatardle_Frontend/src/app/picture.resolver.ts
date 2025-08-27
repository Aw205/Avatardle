import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map, Observable, switchMap } from 'rxjs';
import { DataService, Episode } from './services/data.service';
import Rand from 'rand-seed';

interface PictureData {
  frame: string,
  target: string
}

export const pictureResolver: ResolveFn<Observable<PictureData>> = (route, state) => {

  let http = inject(HttpClient);
  let ds = inject(DataService);
  let rand = new Rand(new Date().toLocaleDateString("en-US", { timeZone: "UTC" }) + "picture");

  return ds.pictureData$.pipe(

    switchMap((picData: Episode) => {

      let targetEpisode: string = ds.episodes[Math.floor(61 * rand.next())];
      let frameIdx = Math.floor(rand.next() * targetEpisode.length);
      let targetFrame = `randomframes/${picData[targetEpisode][frameIdx]}`;
      return http.get(targetFrame, { responseType: "blob" }).pipe(
        map((blob) => {
          return { target: targetEpisode, frame: URL.createObjectURL(blob) }
        })
      );
    })
  );
};
