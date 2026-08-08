import { Component } from '@angular/core';
import {
  MatDialogClose,
  MatDialogTitle,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { TranslatePipe } from "@ngx-translate/core";

type NoteSection = {
  heading?: string;
  paragraphs?: string[];
  items?: string[];
  links?: { label: string; href: string }[];
};

type NoteEntry = {
  date: string;
  title: string;
  summary: string;
  sections: NoteSection[];
};

@Component({
  selector: 'app-notes-dialog',
  imports: [MatDialogClose, MatDialogTitle, MatDialogContent, TranslatePipe],
  templateUrl: './notes-dialog.component.html',
  styleUrl: './notes-dialog.component.css'
})
export class NotesDialogComponent {
  notes: NoteEntry[] = [
    {
      date: '08/03/26',
      title: 'Picture blitz & QOL',
      summary: ':)',
      sections: [
        {
          heading: 'Picture mode - blitz',
          paragraphs: ['Similar to quote blitz, unlock this mode by completing the daily first.','No strikes, one wrong guess and its over!'],
          items: [
            'Leaderboard available!'
          ]
        },
        {
          heading: 'QOL improvements',
          items: [
            'Use arrow keys to navigate the dropdown lists',
            'See answers to quotes in blitz mode',
            'Improved navigation for leaderboard',
            'Redesigned notes modal',
            'Submitting to blitz leaderboard will keep your highest score'
          ]
        }
      ]
    },
    {
      date: '07/12/26',
      title: 'Blitz + Classic Archive',
      summary: 'Something long awaited.',
      sections: [
        {
          heading: 'Classic Archive',
          paragraphs: ['Once you complete the daily, you will be able to access an archive up to 30 days of past puzzles.'],
          items: [
            'Puzzles completed from the archive will not count toward profile progress',
            'Progress in archived puzzles is not saved...for now.'
          ]
        },
        {
          heading: 'Blitz Mode - Quote',
          items: [
            'Guess rapid-fire quotes and score as many points as you can before you get 3 strikes or time runs out!',
            'Attempt as many times as you want.',
            'Post your scores to a blitz leaderboard (must be logged in).'
          ]
        },
        {
          heading: 'Next up...',
          items: [
            'Blitz for picture mode',
            'Leaderboard improvements (more filters, UI, etc)',
            'Additional polish to archives and existing features',
            'More character icons'
          ]
        }
      ]
    },
    {
      date: '05/15/26',
      title: 'Custom profiles',
      summary: 'Who are you in the four nations?',
      sections: [
        {
          heading: 'Custom profiles!',
          paragraphs: ['To get started, click the account icon, select Sign Up, and enter your details to create your profile.'],
          items: ['Rep your favorite element and characters by editing your profile.', "View other people's profiles through the leaderboard."]
        },
        {
          heading: 'Discovered characters',
          items: ['View the characters that you have guessed correctly through your profile.']
        },
        {
          heading: "What's next?",
          items: ['Archive/Unlimited Mode is coming, eventually...', 'More social features, stats, character variants, and maybe achievements.']
        }
      ]
    },
    {
      date: '04/03/26',
      title: 'Colorblind mode',
      summary: 'Reminds me of a certain someone... ',
      sections: [
        {
          heading: 'Colorblind mode',
          paragraphs: ['Adjust the color of the shadows in classic mode. Go to classic -> settings -> colorblind mode.']
        },
        {
          heading: 'New Character',
          items: ['Lo and Li']
        },
        {
          heading: 'Classic mode changes',
          items: [
            "Bending element is no longer marked as incorrect if there is an overlap between 'All' and the other element.",
            'Added and adjusted some character affiliations (Zhao, Freedom Fighters, etc).'
          ]
        },
        {
          paragraphs: ["For a more detailed log of changes, check out the Discord. If you're interested in hearing back on suggestions, Discord is the best way to reach me!"],
          links: [{ label: 'Discord', href: 'https://discord.gg/RxFqZJsSUq' }]
        }
      ]
    },
    {
      date: '02/23/26',
      title: 'Picture hints & more characters',
      summary: 'Any ideas on who to add next?',
      sections: [
        {
          paragraphs: ['Appreciate all the suggestions so far!']
        },
        {
          heading: 'Classic mode - New Characters',
          items: ['Aunt Wu', 'Meng', 'Jee', 'The Duke', 'Pipsqueak', 'Ursa']
        },
        {
          heading: 'Picture mode - Added Hints',
          paragraphs: ["I'm planning on incorporating even more characters perhaps with the option to customize how obscure you want the characters to be. See y'all soon ~"]
        }
      ]
    },
    {
      date: '01/17/26',
      title: 'New Characters, UI + more',
      summary: 'Leaderboard art, new characters, and quote mode improvements.',
      sections: [
        {
          heading: 'Revamped Leaderboard UI',
          paragraphs: ['Admire cute icons!', 'Updated leaderboard UI, with all new art (more to come...).']
        },
        {
          heading: 'Classic mode - New Characters',
          items: ['Kanna (Gran-Gran)', 'Mechanist', 'Professor Zei']
        },
        {
          heading: 'Quote mode improvements!',
          paragraphs: ['Quotes are now much more likely to be from different characters each day. Expect to guess from a much wider range of characters. Should be more challenging!']
        }
      ]
    },
    {
      date: '12/30/25',
      title: 'Daily Leaderboards',
      summary: 'Share your results in classic + Picture mode updates',
      sections: [
        {
          heading: 'Classic Leaderboards!',
          paragraphs: ["This is limited to classic mode, but it should be fun to see what everyone's guesses are like.", 'Picture mode got a slight revamp. It now features more than 2x the number of images along with better resolution. Hints are coming soon as well.', 'Hope everyone enjoyed their holidays!']
        }
      ]
    },
    {
      date: '12/16/25',
      title: 'Wan',
      summary: 'Hello + Community links',
      sections: [
        {
          paragraphs: ["Hey y'all, I'll ocassionally be posting updates in here. We recently made a Discord and a subreddit. If you want to discuss or are just interested about this site in any way, please take a look :)", "There will likely be an additional update near the end of the month, so I'll keep y'all posted then!"],
          links: [
            { label: 'discord', href: 'https://discord.gg/RxFqZJsSUq' },
            { label: 'subreddit', href: 'https://www.reddit.com/r/avatardle/' }
          ]
        }
      ]
    }
  ];

  selectedNote = this.notes[0];

  constructor(public dialogRef: MatDialogRef<NotesDialogComponent>) {}

  selectNote(note: NoteEntry) {
    this.selectedNote = note;
  }

}
