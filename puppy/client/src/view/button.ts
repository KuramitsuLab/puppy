import * as $ from 'jquery';

export type ButtonID = '#play' | '#pause' | '#reload' | '#debug' | '#extend' | '#font-plus' | '#font-minus';

export const buttonActivate = (id: ButtonID) => {
  $(id)[0].setAttribute('stroke', 'black');
};

export const buttonInactivate = (id: ButtonID) => {
  $(id)[0].setAttribute('stroke', 'gray');
};

/* Init */

buttonInactivate('#pause');
