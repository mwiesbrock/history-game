export const MALE_FIRST_NAMES: ReadonlyArray<string> = [
  'Jeremiah', 'Elias', 'Samuel', 'Isaiah', 'Ezekiel', 'Josiah', 'Nathaniel',
  'Thaddeus', 'Silas', 'Caleb', 'Obadiah', 'Ebenezer', 'Amos', 'Reuben',
  'Abner', 'Lemuel', 'Hosea', 'Enoch', 'Gideon', 'Zebulon',
];

export const FEMALE_FIRST_NAMES: ReadonlyArray<string> = [
  'Abigail', 'Prudence', 'Susannah', 'Tabitha', 'Charity', 'Constance',
  'Mehitable', 'Thankful', 'Patience', 'Hepzibah', 'Lavinia', 'Temperance',
  'Dorcas', 'Mercy', 'Keziah', 'Eunice', 'Sybil', 'Lydia', 'Phebe', 'Rhoda',
];

export const SURNAMES: ReadonlyArray<string> = [
  'Alden', 'Bigelow', 'Chase', 'Danforth', 'Eastman', 'Fairchild', 'Gale',
  'Hollister', 'Ingersoll', 'Jewett', 'Knowles', 'Leffingwell', 'Merriam',
  'Nye', 'Otis', 'Payson', 'Quincy', 'Rowell', 'Sawyer', 'Thayer',
  'Upham', 'Vinton', 'Whittaker', 'Yeardley',
];

export type Sex = 'male' | 'female';

export function randomName(sex: Sex, rng: () => number = Math.random): string {
  const pool = sex === 'male' ? MALE_FIRST_NAMES : FEMALE_FIRST_NAMES;
  const first = pool[Math.floor(rng() * pool.length)];
  const last = SURNAMES[Math.floor(rng() * SURNAMES.length)];
  return `${first} ${last}`;
}
