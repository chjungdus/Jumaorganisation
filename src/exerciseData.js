// Anleitungen zu allen Übungen im Trainingsplan.
// demo = Name der Animation in components/ExerciseDemo.jsx
// names = alle Schreibweisen, unter denen die Übung gefunden wird (klein geschrieben wird verglichen)

export const EXERCISES = [
  {
    id: 'chestpress',
    names: ['Chest Press', 'Brustpresse'],
    demo: 'chestpress',
    muscles: 'Brust, vordere Schulter, Trizeps',
    setup: 'Sitzhöhe so einstellen, dass die Griffe auf Höhe der mittleren Brust sind. Rücken und Kopf liegen fest an der Lehne, die Füße stehen flach auf dem Boden.',
    steps: [
      'Griffe fassen und die Schulterblätter nach hinten unten ziehen.',
      'Gleichmäßig nach vorn drücken, bis die Arme fast gestreckt sind. Die Ellbogen nicht ganz durchdrücken.',
      'Oben kurz halten, dann in 2–3 Sekunden langsam zurückkommen, bis du eine leichte Dehnung in der Brust spürst.',
    ],
    tips: [
      'Schultern nicht nach vorn hochziehen.',
      'Kein Hohlkreuz: Po und Rücken bleiben am Polster.',
      'Das Gewicht so wählen, dass die letzten Wiederholungen schwer, aber sauber sind.',
    ],
  },
  {
    id: 'inclinepress',
    names: ['Schrägdrücken (Maschine)', 'Schrägdrücken', 'Schrägbankdrücken', 'Incline Press'],
    demo: 'inclinepress',
    muscles: 'Obere Brust, vordere Schulter, Trizeps',
    setup: 'Die Maschine drückt schräg nach oben. Sitz so einstellen, dass die Griffe knapp unter Schulterhöhe starten. Rücken fest an der Lehne.',
    steps: [
      'Griffe fassen, Brust raus, Schulterblätter zusammen.',
      'Schräg nach oben vorn drücken, bis die Arme fast gestreckt sind.',
      'Langsam kontrolliert zurück, bis die Hände wieder auf Brusthöhe sind.',
    ],
    tips: [
      'Nicht mit dem Kopf nach vorn gehen, der Nacken bleibt locker an der Lehne.',
      'Ellbogen zeigen leicht nach unten, nicht ganz auf Schulterhöhe nach außen.',
    ],
  },
  {
    id: 'butterfly',
    names: ['Butterfly', 'Butterfly (Maschine)', 'Brust Butterfly', 'Fliegende'],
    demo: 'butterfly',
    muscles: 'Brust (innen), vordere Schulter',
    setup: 'Sitz so einstellen, dass die Griffe auf Brusthöhe sind. Arme leicht gebeugt, Rücken an der Lehne.',
    steps: [
      'Griffe fassen, Brust nach vorn, Schultern nach hinten unten.',
      'Die Arme in einem weiten Bogen vor der Brust zusammenführen, die Ellbogen bleiben leicht gebeugt.',
      'Kurz zusammendrücken und langsam wieder öffnen, bis du eine Dehnung in der Brust spürst.',
    ],
    tips: [
      'Nicht zu weit nach hinten öffnen, das belastet die Schultern.',
      'Die Bewegung kommt aus der Brust, nicht aus den Händen.',
    ],
  },
  {
    id: 'latpulldown',
    names: ['Lat Pulldown', 'Latzug', 'Latziehen'],
    demo: 'latpulldown',
    muscles: 'Breiter Rückenmuskel, Bizeps, hintere Schulter',
    setup: 'Das Oberschenkelpolster so einstellen, dass du fest sitzt und nicht hochgezogen wirst.',
    steps: [
      'Stange etwas breiter als schulterbreit greifen und den Oberkörper leicht nach hinten lehnen.',
      'Zuerst die Schulterblätter nach unten ziehen, dann die Stange zur oberen Brust ziehen.',
      'Die Ellbogen zeigen nach unten, nicht nach hinten.',
      'Langsam hochlassen, bis die Arme fast gestreckt sind und du den Rücken dehnst.',
    ],
    tips: [
      'Nicht mit Schwung aus dem Rücken ziehen.',
      'Die Stange nie hinter den Kopf ziehen.',
      'Denk daran, die Ellbogen zur Hüfte zu führen, nicht die Hände zur Brust.',
    ],
  },
  {
    id: 'latnarrow',
    names: ['Latzug (enger Griff)', 'Latzug eng', 'Latzug enger Griff'],
    demo: 'latpulldown',
    muscles: 'Breiter Rückenmuskel (unten), Bizeps',
    setup: 'Enger oder V-Griff einhängen. Oberschenkelpolster fest einstellen.',
    steps: [
      'Griff fassen und den Oberkörper leicht nach hinten lehnen.',
      'Den Griff zur Brust ziehen, die Ellbogen laufen nah am Körper nach unten.',
      'Unten kurz die Schulterblätter zusammendrücken, dann langsam wieder hoch.',
    ],
    tips: [
      'Nicht mit dem ganzen Oberkörper hin und her schaukeln.',
      'Oben die Arme fast ganz strecken, damit der Rücken richtig gedehnt wird.',
    ],
  },
  {
    id: 'verticalrow',
    names: ['Vertical Row', 'Rudern (Maschine)', 'Rudermaschine', 'Rudern'],
    demo: 'verticalrow',
    muscles: 'Mittlerer Rücken, breiter Rückenmuskel, Bizeps',
    setup: 'Brustpolster so einstellen, dass du aufrecht sitzt und die Griffe bei gestreckten Armen gut greifbar sind.',
    steps: [
      'Brust fest ans Polster, Griffe fassen und Schultern tief halten.',
      'Die Ellbogen nach hinten an den Körper ziehen und die Schulterblätter zusammendrücken.',
      'Eine Sekunde halten, dann langsam zurück, bis die Arme gestreckt sind.',
    ],
    tips: [
      'Nicht mit dem Oberkörper nach hinten kippen, die Brust bleibt am Polster.',
      'Schultern nicht zu den Ohren hochziehen.',
    ],
  },
  {
    id: 'cablerow',
    names: ['Kabelrudern', 'Kabelrudern sitzend', 'Rudern am Kabel'],
    demo: 'cablerow',
    muscles: 'Mittlerer Rücken, breiter Rückenmuskel, Bizeps',
    setup: 'Füße fest auf der Fußplatte, Knie leicht gebeugt. Rücken gerade und Brust raus.',
    steps: [
      'Griff fassen und mit geradem Rücken aufrecht hinsetzen, die Arme sind gestreckt.',
      'Den Griff zum Bauchnabel ziehen und die Ellbogen eng an den Körper nach hinten führen.',
      'Schulterblätter zusammendrücken, kurz halten, dann langsam nach vorn lassen.',
    ],
    tips: [
      'Kein runder Rücken: auch beim Zurücklassen den Rücken gerade halten.',
      'Oberkörper bleibt ruhig, nur leicht nach hinten lehnen.',
    ],
  },
  {
    id: 'facepull',
    names: ['Face Pulls', 'Face Pull'],
    demo: 'facepull',
    muscles: 'Hintere Schulter, oberer Rücken, Rotatorenmanschette',
    setup: 'Kabel mit Seil auf Gesichtshöhe einstellen. Ein paar Schritte zurücktreten, Füße schulterbreit.',
    steps: [
      'Seil mit beiden Händen fassen, Daumen zeigen zu dir.',
      'Das Seil zum Gesicht ziehen und die Hände links und rechts neben die Ohren bringen. Die Ellbogen sind dabei hoch.',
      'Kurz halten, dann langsam wieder strecken.',
    ],
    tips: [
      'Ein leichtes Gewicht reicht, hier zählt die saubere Ausführung.',
      'Nicht mit dem Körper nach hinten lehnen.',
    ],
  },
  {
    id: 'shoulderpress',
    names: ['Schulterdrücken (Maschine)', 'Schulterdrücken', 'Schulterdrücken (Kurzhantel)', 'Shoulder Press'],
    demo: 'shoulderpress',
    muscles: 'Schultern, Trizeps',
    setup: 'Sitz so einstellen, dass die Griffe auf Schulterhöhe starten. Rücken fest an der Lehne.',
    steps: [
      'Griffe fassen, die Ellbogen sind unter den Händen.',
      'Nach oben drücken, bis die Arme fast gestreckt sind.',
      'Langsam wieder bis auf Schulterhöhe absenken.',
    ],
    tips: [
      'Nicht ins Hohlkreuz gehen, Bauch leicht anspannen.',
      'Die Schultern nicht zu den Ohren hochziehen.',
    ],
  },
  {
    id: 'lateralraise',
    names: ['Seitheben', 'Seitheben (Kurzhantel)'],
    demo: 'lateralraise',
    muscles: 'Seitliche Schulter',
    setup: 'Leichte Kurzhanteln, Füße hüftbreit, Oberkörper aufrecht. Die Ellbogen sind leicht gebeugt.',
    steps: [
      'Die Hanteln seitlich neben dem Körper halten.',
      'Die Arme seitlich bis auf Schulterhöhe anheben, nicht höher.',
      'Oben kurz halten und in 2–3 Sekunden langsam wieder absenken.',
    ],
    tips: [
      'Kein Schwung aus dem Oberkörper, lieber weniger Gewicht.',
      'Der Ellbogen führt die Bewegung, nicht die Hand.',
      'Schultern unten lassen und nicht hochziehen.',
    ],
  },
  {
    id: 'lateralraisecable',
    names: ['Seitheben am Kabel', 'Seitheben Kabel'],
    demo: 'lateralraise',
    muscles: 'Seitliche Schulter',
    setup: 'Kabel ganz unten einhängen und seitlich zum Kabel stehen. Mit der entfernten Hand den Griff fassen.',
    steps: [
      'Den Arm quer vor dem Körper starten, der Ellbogen ist leicht gebeugt.',
      'Den Arm seitlich bis auf Schulterhöhe anheben.',
      'Oben kurz halten und langsam wieder absenken. Danach die Seite wechseln.',
    ],
    tips: [
      'Das Kabel hält die Spannung dauerhaft, deshalb unten nicht ganz ablegen.',
      'Der Oberkörper bleibt aufrecht und ruhig.',
    ],
  },
  {
    id: 'reversebutterfly',
    names: ['Reverse Butterfly', 'Reverse Fly', 'Reverse Flys'],
    demo: 'reversebutterfly',
    muscles: 'Hintere Schulter, oberer Rücken',
    setup: 'Auf der Maschine mit der Brust zum Polster sitzen. Sitzhöhe so einstellen, dass die Griffe auf Schulterhöhe sind.',
    steps: [
      'Griffe fassen, die Arme sind leicht gebeugt.',
      'Die Arme in einem weiten Bogen nach hinten öffnen und die Schulterblätter zusammenziehen.',
      'Kurz halten und langsam wieder nach vorn lassen.',
    ],
    tips: [
      'Brust bleibt am Polster, nicht mit Schwung arbeiten.',
      'Nicht mit den Händen ziehen, die Ellbogen führen nach hinten.',
    ],
  },
  {
    id: 'biceps',
    names: ['Bizepscurls', 'Bizeps Curls', 'Bizeps-Curls', 'Bizepscurl'],
    demo: 'curl',
    muscles: 'Bizeps',
    setup: 'Aufrecht stehen, Hanteln mit Handflächen nach vorn halten. Die Ellbogen liegen am Körper.',
    steps: [
      'Die Hanteln durch Beugen der Ellbogen nach oben zu den Schultern curlen.',
      'Oben kurz anspannen.',
      'In 2–3 Sekunden langsam wieder ganz absenken.',
    ],
    tips: [
      'Die Ellbogen bleiben am Körper und wandern nicht nach vorn.',
      'Nicht mit dem Rücken schwingen, lieber weniger Gewicht.',
    ],
  },
  {
    id: 'hammer',
    names: ['Hammercurls', 'Hammer Curls', 'Hammercurl'],
    demo: 'curl',
    muscles: 'Bizeps, Oberarmmuskel, Unterarm',
    setup: 'Aufrecht stehen, Hanteln so halten, dass die Handflächen zueinander zeigen (wie beim Halten eines Hammers).',
    steps: [
      'Die Hanteln mit unverändertem Griff nach oben zu den Schultern curlen.',
      'Oben kurz halten.',
      'Langsam wieder ganz absenken.',
    ],
    tips: [
      'Handgelenke gerade halten und nicht abknicken.',
      'Ellbogen am Körper lassen.',
    ],
  },
  {
    id: 'triceps',
    names: ['Trizepsdrücken', 'Trizepsdrücken am Kabel', 'Trizeps Pushdown', 'Trizeps'],
    demo: 'pushdown',
    muscles: 'Trizeps',
    setup: 'Kabel oben einhängen, Seil oder Stange greifen. Leicht nach vorn lehnen, Füße hüftbreit.',
    steps: [
      'Die Ellbogen an den Körper legen, die Hände sind auf Brusthöhe.',
      'Die Arme nach unten durchstrecken, bis sie gerade sind.',
      'Unten kurz anspannen, dann langsam wieder hoch bis etwa 90° im Ellbogen.',
    ],
    tips: [
      'Die Ellbogen bleiben fest am Körper, nur der Unterarm bewegt sich.',
      'Nicht mit dem Oberkörper auf das Gewicht drücken.',
    ],
  },
  {
    id: 'reversecurl',
    names: ['Reverse Curls', 'Reverse Curl'],
    demo: 'curl',
    muscles: 'Unterarm, Oberarmmuskel',
    setup: 'Stange oder SZ-Stange mit Obergriff fassen (Handrücken zeigen nach oben). Aufrecht stehen, Ellbogen am Körper.',
    steps: [
      'Die Stange mit dem Obergriff nach oben curlen.',
      'Oben kurz halten, die Handgelenke bleiben gerade.',
      'Langsam wieder ganz absenken.',
    ],
    tips: [
      'Leichtes Gewicht nehmen, Unterarme sind schwächer als der Bizeps.',
      'Handgelenke nicht nach unten abknicken lassen.',
    ],
  },
  {
    id: 'wristcurl',
    names: ['Handgelenkcurls', 'Handgelenkcurl', 'Wrist Curls', 'Wrist Curl'],
    demo: 'wristcurl',
    muscles: 'Unterarm (Handgelenkbeuger)',
    setup: 'Auf eine Bank oder einen Stuhl setzen. Die Unterarme liegen mit den Handflächen nach oben auf den Oberschenkeln, die Hände ragen über die Knie hinaus. In den Händen eine leichte Kurzhantel oder SZ-Stange.',
    steps: [
      'Das Handgelenk nach unten sinken lassen, bis die Finger die Hantel fast loslassen und du eine Dehnung im Unterarm spürst.',
      'Die Hantel nur mit dem Handgelenk nach oben curlen, so hoch wie möglich.',
      'Oben kurz anspannen und langsam wieder absenken.',
    ],
    tips: [
      'Die Unterarme bleiben fest auf den Oberschenkeln, nur die Hände bewegen sich.',
      'Mit leichtem Gewicht und vielen Wiederholungen (12–20) arbeiten.',
      'Die volle Bewegung nutzen, auch unten in der Dehnung.',
    ],
  },
  {
    id: 'legpress',
    names: ['Beinpresse', 'Leg Press'],
    demo: 'legpress',
    muscles: 'Oberschenkel vorn, Po',
    setup: 'Sitz so einstellen, dass die Knie in der unteren Position etwa 90° gebeugt sind. Füße schulterbreit mittig auf die Platte.',
    steps: [
      'Rücken und Po fest am Polster, Griffe festhalten.',
      'Die Platte mit der ganzen Fußfläche wegdrücken, bis die Beine fast gestreckt sind.',
      'Langsam wieder zurücklassen, bis die Knie etwa 90° gebeugt sind.',
    ],
    tips: [
      'Knie nie ganz durchdrücken und nicht nach innen kippen lassen.',
      'Po bleibt unten am Sitz, sonst rundet sich der untere Rücken.',
      'Fersen bleiben auf der Platte.',
    ],
  },
  {
    id: 'legcurl',
    names: ['Leg Curl sitzend', 'Leg Curl', 'Beinbeuger'],
    demo: 'legcurl',
    muscles: 'Oberschenkel hinten',
    setup: 'Sitz so einstellen, dass das Kniegelenk auf Höhe der Maschinenachse ist. Das Polster liegt knapp über den Fersen.',
    steps: [
      'Das Oberschenkelpolster fest andrücken, Rücken an der Lehne.',
      'Die Fersen unter dich ziehen, bis die Beine stark gebeugt sind.',
      'Kurz anspannen und in 2–3 Sekunden langsam wieder nach vorn lassen.',
    ],
    tips: [
      'Hüfte bleibt auf dem Sitz, nicht nach vorn schieben.',
      'Nicht mit Schwung arbeiten.',
    ],
  },
  {
    id: 'legextension',
    names: ['Beinstrecker', 'Leg Extension'],
    demo: 'legextension',
    muscles: 'Oberschenkel vorn',
    setup: 'Sitz so einstellen, dass das Kniegelenk auf Höhe der Achse ist. Das Polster liegt knapp über den Knöcheln.',
    steps: [
      'Rücken an die Lehne, Griffe seitlich festhalten.',
      'Die Beine nach vorn strecken, bis sie fast gerade sind.',
      'Oben kurz anspannen und langsam wieder absenken.',
    ],
    tips: [
      'Das Gewicht nicht hochschleudern.',
      'Nicht ganz durchdrücken, damit das Knie geschont wird.',
    ],
  },
  {
    id: 'gobletsquat',
    names: ['Goblet Squats', 'Goblet Squat', 'Kniebeuge mit Kurzhantel'],
    demo: 'gobletsquat',
    muscles: 'Oberschenkel vorn, Po',
    setup: 'Eine Kurzhantel senkrecht an einem Ende mit beiden Händen vor der Brust halten. Füße etwas mehr als schulterbreit, Fußspitzen leicht nach außen.',
    steps: [
      'Brust raus, Bauch fest, die Hantel bleibt dicht am Körper.',
      'Hüfte nach hinten unten setzen, bis die Oberschenkel etwa waagerecht sind. Die Ellbogen gehen dabei zwischen die Knie.',
      'Über die ganze Fußsohle kräftig hochdrücken, bis du wieder aufrecht stehst.',
    ],
    tips: [
      'Die Knie zeigen in Richtung Fußspitzen und kippen nicht nach innen.',
      'Die Fersen bleiben am Boden.',
      'Vor dem Spiel lieber mittelschwer bleiben und nicht bis zum Versagen gehen.',
    ],
  },
  {
    id: 'calfstanding',
    names: ['Wadenheben stehend', 'Wadenheben', 'Calf Raises'],
    demo: 'calfstanding',
    muscles: 'Waden (großer Wadenmuskel)',
    setup: 'Mit den Fußballen auf der Kante der Wadenmaschine oder einer Stufe stehen, Fersen hängen frei. Beine gestreckt.',
    steps: [
      'Die Fersen ganz nach unten in die Dehnung senken und dort 1–2 Sekunden halten.',
      'Auf die Zehenspitzen hochdrücken, so hoch wie möglich.',
      'Oben kurz anspannen und langsam wieder absenken.',
    ],
    tips: [
      'Die volle Bewegung nutzen: unten dehnen, oben hoch.',
      'Nicht federn oder wippen.',
      'Ruhig auch bis zum Versagen gehen, die Waden vertragen das gut.',
    ],
  },
  {
    id: 'calfpress',
    names: ['Wadendrücken an der Beinpresse', 'Wadendrücken', 'Calf Press', 'Wadenheben sitzend'],
    demo: 'calfpress',
    muscles: 'Waden',
    setup: 'In die Beinpresse setzen und nur die Fußballen unten auf die Kante der Platte stellen, die Fersen hängen frei. Die Beine fast gestreckt, aber nicht ganz durchgedrückt. Die Sicherung bleibt eingerastet bzw. die Griffe zu.',
    steps: [
      'Die Fersen Richtung Körper kommen lassen, bis du die Wade dehnst, und 1–2 Sekunden halten.',
      'Die Platte nur mit den Fußballen wegdrücken, so weit es geht (wie auf die Zehenspitzen gehen).',
      'Oben kurz anspannen und langsam zurück in die Dehnung.',
    ],
    tips: [
      'Die Knie bewegen sich nicht, nur das Fußgelenk arbeitet.',
      'Mit den Füßen nicht von der Platte rutschen, lieber etwas weniger Gewicht.',
      'Nicht wippen, unten immer kurz halten.',
    ],
  },
  {
    id: 'crunch',
    names: ['Crunches', 'Crunch', 'Bauch'],
    demo: 'crunch',
    muscles: 'Gerader Bauchmuskel',
    setup: 'Auf den Rücken legen, die Knie sind gebeugt, die Füße stehen auf dem Boden. Hände seitlich an den Kopf oder vor die Brust.',
    steps: [
      'Den Bauch anspannen und den Oberkörper nur wenige Zentimeter einrollen, die Schulterblätter gehen vom Boden.',
      'Oben kurz anspannen und ausatmen.',
      'Langsam wieder absenken, ohne den Kopf ganz abzulegen.',
    ],
    tips: [
      'Nicht am Nacken ziehen, der Blick geht zur Decke.',
      'Der untere Rücken bleibt auf dem Boden.',
    ],
  },
]

const NAME_MAP = new Map()
EXERCISES.forEach(ex => ex.names.forEach(n => NAME_MAP.set(n.trim().toLowerCase(), ex)))

export function findExercise(name) {
  if (!name) return null
  const key = String(name).trim().toLowerCase()
  return NAME_MAP.get(key) || NAME_MAP.get(key.replace(/\s*\(.*\)\s*$/, '')) || null
}
