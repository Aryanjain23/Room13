export const ROOMMATE_PROFILE = {
  name: 'Rohan',
  subtitle: 'Roommate · 2nd Year CSE',
  description:
    'Your roommate Rohan sits on the edge of the bed, half-distracted and watching the clock. Like you, he got locked in before the warden’s inspection.',
};

export const ROOMMATE_DIALOGUE = {
  easy: {
    greeting:
      'Man, I cannot believe the warden bolted the hallway latch early. If we do not figure out that keypad soon, we are stuck explaining why we missed roll call.',
    topics: [
      {
        id: 'clock',
        label: 'Ask about the wall clock',
        line: 'I swear that clock has been showing 10:40 all evening. Look closely at the rim—someone scratched a reminder about using the tens digit of the minutes.',
        isClue: true,
      },
      {
        id: 'board',
        label: 'Ask about the notices & bed',
        line: 'Check the inspection sheet on the corkboard for our floor number, and glance under the bed rail—there is a metal tag down there. The open notebook on the desk says the exact order to read them.',
        isClue: true,
      },
      {
        id: 'door',
        label: 'Ask about the exit door',
        line: 'That brass keypad near the door looks newer than the hostel itself. Whatever note is locked inside the desk drawer explains how the room number and curfew hour pair up.',
        isClue: true,
      },
      {
        id: 'casual',
        label: 'Ask how he got stuck here',
        line: 'My phone died twenty minutes ago right after mess dinner. Half a cup of cold chai on the desk and zero signal—classic Block B night.',
        isClue: false,
      },
    ],
  },

  moderate: {
    greeting:
      'Listen, I heard footsteps near the stairwell earlier. Whoever rigged these locks used spots across different corners of the room—we need to connect them.',
    topics: [
      {
        id: 'clock',
        label: 'Ask about the wall clock',
        line: 'That clock stopped just five minutes shy of midnight. Look closely at the rim—it cares about how many minutes are left before 12:00.',
        isClue: true,
      },
      {
        id: 'wardrobe',
        label: 'Ask about the wooden wardrobe',
        line: 'I tossed my hoodie into the almirah earlier and noticed a single-digit locker number chalked on the upper shelf inside.',
        isClue: true,
      },
      {
        id: 'board',
        label: 'Ask about the notices & notebook',
        line: 'Check the notice board for both our floor and when the main gate locks—they wrote midnight as 24:00. The spiral notebook tells you the exact order for the drawer dials.',
        isClue: true,
      },
      {
        id: 'casual',
        label: 'Ask why he is sitting on the bed',
        line: 'I already checked the courtyard window—steel bars all the way down, and the night air is freezing. Only way out is through that timber door.',
        isClue: false,
      },
    ],
  },

  hard: {
    greeting:
      'Keep your voice down. The warden checks Block B unpredictably. Every single lock here requires combining observations from more than one object.',
    topics: [
      {
        id: 'desk',
        label: 'Ask what he noticed around the desk',
        line: 'Someone stacked heavy hardcover textbooks on the left side of the desk, and the open notebook has a three-part arithmetic formula referencing both the bed tag and those books.',
        isClue: true,
      },
      {
        id: 'clock',
        label: 'Ask about the wall clock & wardrobe',
        line: 'The clock stopped right on the half-hour—there is a rim note about measuring minutes past :30. Also, check inside the wardrobe doors; there is a two-digit compartment stencil on the shelf.',
        isClue: true,
      },
      {
        id: 'board',
        label: 'Ask about the notice board & bed',
        line: 'The bed rail has a two-digit inventory plate, and the notice board lists our floor, room number, and evening curfew hour. Subtracting and multiplying the right pieces makes everything click.',
        isClue: true,
      },
      {
        id: 'casual',
        label: 'Ask if he tried the door',
        line: 'Twice. Brass lever does not budge a millimeter without the keypad. Also, whoever left those slippers by the bed owes me dry socks.',
        isClue: false,
      },
    ],
  },
};
