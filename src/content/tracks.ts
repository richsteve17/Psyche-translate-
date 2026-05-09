import { Module, Track } from '../types';
import { frontDeskGreetings } from './modules/frontdesk-greetings';

const stub = (id: string, title: string, blurb: string): Module => ({
  id,
  title,
  blurb,
  available: false,
  phrases: [],
  drills: [],
  scenarios: [],
});

export const tracks: Track[] = [
  {
    id: 'front-desk',
    title: 'Front Desk',
    blurb: 'The job you have right now. Lobby, phones, intake, handoffs.',
    modules: [
      frontDeskGreetings,
      stub('frontdesk-phones', 'Phone Scripts', 'Answer, transfer, take a message, schedule.'),
      stub(
        'frontdesk-appointments',
        'Appointment Language',
        'Schedule, reschedule, cancel, confirm, no-show.',
      ),
      stub(
        'frontdesk-visitors',
        'Visitor & Family Questions',
        'Who can come back, waiting room rules, when the patient will be out.',
      ),
      stub(
        'frontdesk-hipaa',
        'HIPAA-safe Responses',
        '"I can\'t share that" without sounding cold.',
      ),
      stub(
        'frontdesk-deescalation',
        'Lobby De-escalation',
        'When voices rise. Slow it down, stay warm, don\'t escalate.',
      ),
      stub(
        'frontdesk-translator',
        'Translator Handoff',
        '"Let me get someone who speaks Spanish" — cleanly, without abandoning them.',
      ),
    ],
  },
  {
    id: 'psych-nursing',
    title: 'Psych Nursing',
    blurb: 'The role you\'re training for. Clinical, ethical, sometimes hard.',
    modules: [
      stub(
        'psych-mse',
        'Mental Status Exam',
        'Orientation, mood, affect, thought process, perception, insight.',
      ),
      stub(
        'psych-safety',
        'Safety & Suicide Assessment',
        'Direct questions in Spanish, asked without flinching.',
      ),
      stub(
        'psych-meds',
        'Psych Meds & Side Effects',
        'Common meds, what to ask, what to warn about.',
      ),
      stub(
        'psych-deescalation',
        'De-escalation Phrases',
        'For agitation, paranoia, escalating distress.',
      ),
      stub(
        'psych-family',
        'Family Conversations',
        'Involuntary holds, treatment plans, what to expect.',
      ),
      stub(
        'psych-cultural',
        'Cultural Framing',
        'Nervios, ataque de nervios, somatic depression, religion as coping.',
      ),
    ],
  },
];

export function findTrack(id: string): Track | undefined {
  return tracks.find((t) => t.id === id);
}

export function findModule(trackId: string, moduleId: string): Module | undefined {
  return findTrack(trackId)?.modules.find((m) => m.id === moduleId);
}
