import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map, Observable, switchMap } from 'rxjs';
import { DataService, Episode } from './services/data.service';
import Rand from 'rand-seed';
import { environment } from '../environments/environment';

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
      let frameIdx = String(Math.floor(rand.next() * picData[targetEpisode])).padStart(3,'0');
      let targetFrame = `${environment.R2Url}/frames/${encodeURIComponent(targetEpisode)}/frame_${frameIdx}.webp`;
      return http.get(targetFrame, { responseType: "blob" }).pipe(
        map((blob) => {
          return { target: targetEpisode, frame: URL.createObjectURL(blob) }
        })
      );
    })
  );
};
