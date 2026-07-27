import type { Slide } from './types';

export const FACEBOOK_REEL_EMBED =
  'https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fwww.facebook.com%2Freel%2F1515863629476795%2F&show_text=false&width=267&t=0';

export const SLIDES: Slide[] = [
  {
    id: 'cover',
    number: '01',
    label: 'Welcome',
    eyebrow: 'Digital Education Series',
    title: 'NHG Health App',
    lede: 'A simple, step-by-step guide for seniors',
    theme: 'dark',
    speakerNotes:
      'Welcome everyone. Today we learn the NHG Health App together — one step at a time. No rush.',
    body: {
      kind: 'cover',
      presentedBy: ['Care Corner Singapore', 'Active Ageing & Senior Services'],
    },
  },
  {
    id: 'overview',
    number: '02',
    label: 'What the app does',
    eyebrow: 'Overview',
    title: 'Five things the app does for you',
    lede: 'Everything today happens in the app. You will need your phone and your Singpass.',
    theme: 'light',
    speakerNotes:
      'Five things only. Tell them we will practise each one today. Reassure: they do not need to remember everything.',
    body: {
      kind: 'overview',
      cards: [
        { number: '01', title: 'Book an appointment', body: 'Choose your clinic, reason and time slot.' },
        { number: '02', title: 'Register your queue', body: 'Join the queue from home and see your itinerary.' },
        { number: '03', title: 'Say “I have arrived”', body: 'Check in at the clinic without queueing at a counter.' },
        { number: '04', title: 'See your health info', body: 'Allergies, health issues and medicines in one place.' },
        { number: '05', title: 'Request a refill', body: 'Ask for more medicine and have it delivered.' },
      ],
    },
  },
  {
    id: 'getting-started',
    number: '03',
    label: 'Getting started',
    eyebrow: 'Set up · Once only',
    title: 'Getting started with the app',
    lede: 'Guide page 5 · About 5 minutes',
    theme: 'light',
    speakerNotes:
      'Walk the room through the QR code first. Pause after each step and let everyone catch up before moving on.',
    body: {
      kind: 'steps',
      steps: [
        {
          marker: '1',
          caption: 'Scan the QR code to download NHG Health from Google Play or the App Store.',
          mock: [{ kind: 'qr' }],
        },
        {
          marker: '2',
          caption: 'Tap your preferred language, then Confirm.',
          mock: [
            { kind: 'chips', items: ['English', '中文', 'Melayu'], active: 'English' },
            { kind: 'button', label: 'Confirm', primary: true },
          ],
        },
        {
          marker: '3',
          caption: 'Tap the big Start button.',
          mock: [{ kind: 'button', label: 'Start', primary: true }],
        },
        {
          marker: '4',
          caption: 'Read the Terms of Use, tick the box and tap I accept.',
          mock: [
            { kind: 'checkbox', label: 'I accept the Terms of Use' },
            { kind: 'button', label: 'I accept', primary: true },
          ],
        },
        {
          marker: '5',
          caption: 'Fill in your details and tap Finish Setup. Done!',
          mock: [
            { kind: 'row', label: 'Name' },
            { kind: 'row', label: 'Mobile number' },
            { kind: 'button', label: 'Finish Setup', primary: true },
          ],
        },
      ],
    },
  },
  {
    id: 'book-appointment',
    number: '04',
    label: 'Book appointment',
    eyebrow: 'Appointments · Guide page 16',
    title: 'Booking an appointment',
    lede: 'Book your own polyclinic visit in four taps. You will log in with Singpass.',
    theme: 'light',
    speakerNotes:
      'Only NHG Polyclinics and National Skin Centre can be booked directly in the app. Everything else opens a request form.',
    body: {
      kind: 'steps',
      callout: {
        title: 'Good to know',
        body: 'Direct booking is for NHG Polyclinics and the National Skin Centre. Other hospitals open a request form instead.',
      },
      steps: [
        {
          marker: '1',
          caption: 'Tap Appointments, then NHG Appointments.',
          mockTitle: 'Home',
          mock: [
            {
              kind: 'nav',
              items: ['Appointments', 'My Care Plan', 'Payments'],
              active: 'Appointments',
            },
          ],
        },
        {
          marker: '2',
          caption: 'Tap Add New Appointment.',
          mockTitle: 'Upcoming',
          mock: [
            { kind: 'row', label: 'No appointments yet' },
            { kind: 'button', label: '+ Add New Appointment', primary: true },
          ],
        },
        {
          marker: '3',
          caption: 'Choose clinic, purpose and time slot. Tap Submit.',
          mock: [
            { kind: 'row', label: 'Institution' },
            { kind: 'row', label: 'Purpose' },
            { kind: 'row', label: 'Time slot' },
            { kind: 'button', label: 'Submit', primary: true },
          ],
        },
        {
          marker: '4',
          caption: 'Check the details and tap Confirm.',
          mockTitle: 'Review',
          mock: [
            { kind: 'row', label: 'Yishun Polyclinic', sub: 'Health check' },
            { kind: 'row', label: '12 Aug, 9:30 am' },
            { kind: 'button', label: 'Confirm', primary: true },
          ],
        },
      ],
    },
  },
  {
    id: 'register-queue',
    number: '05',
    label: 'Register queue',
    eyebrow: 'Clinic day · Guide page 18',
    title: 'Registering for the queue',
    lede: 'Register from home on the morning of your visit. Your e-Itinerary then shows every stop of the day.',
    theme: 'light',
    speakerNotes:
      'Registering early means less waiting at the clinic. The e-Itinerary shows every station for the visit.',
    body: {
      kind: 'steps',
      callout: {
        title: 'Where it works',
        body: 'All NHG institutions except the National Skin Centre.',
      },
      steps: [
        {
          marker: '1',
          caption: 'Open Appointments and tap Register.',
          mockTitle: 'Today’s appointment',
          mock: [
            { kind: 'row', label: 'Yishun Polyclinic', sub: '9:30 am · Consultation' },
            { kind: 'button', label: 'Register', primary: true },
          ],
        },
        {
          marker: '2',
          caption: 'Answer the few questions, then tap Confirm.',
          mockTitle: 'Short questionnaire',
          mock: [
            { kind: 'chips', items: ['Yes', 'No'], active: 'Yes' },
            { kind: 'button', label: 'Confirm', primary: true },
          ],
        },
        {
          marker: '3',
          caption: 'Your itinerary appears with the status Pending Arrival.',
          mockTitle: 'e-Itinerary',
          mock: [
            { kind: 'status', label: 'Pending Arrival' },
            { kind: 'itinerary', items: ['Registration', 'Consultation', 'Pharmacy'], doneCount: 0 },
          ],
        },
      ],
    },
  },
  {
    id: 'i-have-arrived',
    number: '06',
    label: 'I have arrived',
    eyebrow: 'Clinic day · Guide page 19',
    title: 'Checking in when you arrive',
    lede: 'No counter, no paper. One tap tells the clinic you are here.',
    theme: 'dark',
    speakerNotes:
      'Thirty minutes before, not earlier. After checking in they can watch the queue on the phone instead of standing at the counter.',
    body: {
      kind: 'steps',
      stat: {
        value: '30',
        body: 'minutes before your appointment — that is when the I have arrived button turns on.',
      },
      steps: [
        {
          marker: '1',
          caption: 'Tap I have arrived when you reach the clinic.',
          mockTitle: 'Appointment card',
          mock: [
            { kind: 'row', label: 'Yishun Polyclinic', sub: '9:30 am' },
            { kind: 'button', label: 'I have arrived', primary: true },
          ],
        },
        {
          marker: '2',
          caption: 'Your status and e-Itinerary update on their own.',
          mockTitle: 'Status',
          mock: [
            { kind: 'status', label: 'Arrived' },
            { kind: 'itinerary', items: ['Registration', 'Consultation', 'Pharmacy'], doneCount: 1 },
          ],
        },
        {
          marker: '3',
          caption: 'Tap Check Queue any time to see your turn.',
          mockTitle: 'Queue number',
          mock: [
            { kind: 'big', label: 'A 24' },
            { kind: 'button', label: 'Check Queue', primary: true },
          ],
        },
      ],
    },
  },
  {
    id: 'allergies',
    number: '07',
    label: 'Allergies & health issues',
    eyebrow: 'My Care Plan · Guide page 43',
    title: 'Allergies and health issues',
    lede: 'Your record from the clinic, on your phone. Useful when a new doctor asks, “Any allergies?”',
    theme: 'light',
    speakerNotes:
      'Encourage them to look at this before any hospital visit — it is what doctors need to know quickly.',
    body: {
      kind: 'steps',
      callout: {
        title: 'Tip',
        body: 'Show this screen to the nurse instead of trying to remember every name.',
      },
      steps: [
        {
          marker: '1',
          caption: 'Tap My Care Plan.',
          mockTitle: 'Home',
          mock: [
            {
              kind: 'nav',
              items: ['My Care Plan', 'Appointments', 'Payments'],
              active: 'My Care Plan',
            },
          ],
        },
        {
          marker: '2',
          caption: 'Scroll down to My Health Info and tap either one.',
          mockTitle: 'My Health Info',
          mock: [
            { kind: 'row', label: 'Allergies' },
            { kind: 'row', label: 'Health Issues' },
            { kind: 'row', label: 'Medications' },
          ],
        },
        {
          marker: '3',
          caption: 'Read your list. It comes from your clinic records.',
          mockTitle: 'Allergies',
          mock: [
            { kind: 'row', label: 'Penicillin · Rash' },
            { kind: 'row', label: 'Seafood · Itching' },
            { kind: 'row', label: 'Recorded by your clinic' },
          ],
        },
      ],
    },
  },
  {
    id: 'medications',
    number: '08',
    label: 'Medications',
    eyebrow: 'My Care Plan · Guide page 44',
    title: 'Your medicines, with your own notes',
    lede: 'Every prescribed medicine is listed. You can add a short note in your own words.',
    theme: 'light',
    speakerNotes:
      "The Edit button adds a personal note — for example 'take after breakfast'. This is the part participants enjoy most.",
    body: {
      kind: 'steps',
      callout: {
        title: 'Try this today',
        body: 'Add a note to one medicine — “after breakfast”, “白色药丸”, or whatever helps you remember.',
      },
      steps: [
        {
          marker: '1',
          caption: 'In My Care Plan, tap Medications.',
          mockTitle: 'My Health Info',
          mock: [
            {
              kind: 'nav',
              items: ['Allergies', 'Medications', 'MOH Health Plan'],
              active: 'Medications',
            },
          ],
        },
        {
          marker: '2',
          caption: 'See every medicine and how to take it.',
          mockTitle: 'Medications',
          mock: [
            { kind: 'row', label: 'Metformin 500mg', sub: 'Twice daily' },
            { kind: 'row', label: 'Amlodipine 5mg', sub: 'Once in the morning' },
          ],
        },
        {
          marker: '3',
          caption: 'Tap Edit to write your own reminder.',
          mockTitle: 'Metformin 500mg',
          mock: [
            { kind: 'row', label: 'My note: after breakfast' },
            { kind: 'button', label: 'Edit', primary: true },
          ],
        },
      ],
    },
  },
  {
    id: 'medicine-refill',
    number: '09',
    label: 'Medicine refill',
    eyebrow: 'Medication · Guide pages 59–60',
    title: 'Asking for a medicine refill',
    lede: 'Three simple parts: tell them who you are, where to send it, and how you will pay. Running low? Order before your last week of tablets.',
    theme: 'light',
    speakerNotes:
      'Nine steps sounds like a lot — say it is really just: who you are, where to send it, how to pay. Delivery takes a few working days.',
    body: {
      kind: 'steps',
      lettered: true,
      steps: [
        {
          marker: 'A',
          caption: 'Open Medications, choose the medicines you need, and tap Request Refill.',
          mockTitle: 'Start the request',
          mock: [
            { kind: 'checkbox', label: 'Metformin 500mg' },
            { kind: 'checkbox', label: 'Amlodipine 5mg' },
          ],
        },
        {
          marker: 'B',
          caption: 'Fill in your contact details, then choose collection or home delivery. Tap Next each time.',
          mockTitle: 'Details and delivery',
          mock: [
            { kind: 'row', label: 'Mobile number' },
            { kind: 'chips', items: ['Collection', 'Home delivery'], active: 'Home delivery' },
          ],
        },
        {
          marker: 'C',
          caption: 'Pick your payment option, check the summary, and tap Submit request.',
          mockTitle: 'Pay and submit',
          mock: [
            { kind: 'button', label: 'Submit request', primary: true },
            { kind: 'status', label: 'Request Submitted' },
          ],
        },
      ],
    },
  },
  {
    id: 'watch-video',
    number: '10',
    label: 'See it in action',
    eyebrow: 'Watch',
    title: 'See it in action',
    lede: 'A short video showing the app being used, before you try it yourself.',
    theme: 'dark',
    speakerNotes:
      'Play the video for the room. Afterwards, ask if anyone saw a screen they recognise from their own phone.',
    body: {
      kind: 'video',
      embedUrl: FACEBOOK_REEL_EMBED,
      posterTitle: 'Watch: using the NHG Health App',
      posterBody: 'Tap to play. The video loads from Facebook only when you tap.',
    },
  },
  {
    id: 'practice',
    number: '11',
    label: 'Practice time',
    eyebrow: 'Your turn',
    title: 'Practice time',
    lede: 'Take out your phone. Try these three with the person beside you — a volunteer will come around to help.',
    theme: 'light',
    speakerNotes:
      'Pair participants up. Volunteers walk the room. Finish by reminding them of the helpline and the next session.',
    body: {
      kind: 'practice',
      tasks: [
        'Open the app and find Appointments.',
        'Find your Allergies list in My Care Plan.',
        'Add one note to a medicine.',
      ],
      quiz: {
        question: 'How many minutes before your appointment can you tap "I have arrived"?',
        options: [
          { label: '10', correct: false },
          { label: '30', correct: true },
          { label: '60', correct: false },
        ],
        correctFeedback: 'That is right — 30 minutes before your appointment.',
        retryFeedback: 'Not quite. Have another look at the "I have arrived" slide, then try again.',
      },
      help: {
        title: 'Need help after today?',
        body: 'Drop by your Care Corner Active Ageing Centre. Bring your phone and your Singpass — we will sit with you.',
      },
    },
  },
];
