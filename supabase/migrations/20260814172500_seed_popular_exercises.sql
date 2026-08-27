-- Seed des 50 exercices (une fois par coach, sans doublon de nom).
-- À exécuter dans l’éditeur SQL Supabase si la bibliothèque est vide.

insert into public.exercises (coach_id, name, muscle_group, video_url, cues, vigilance_points)
select
  p.id,
  v.name,
  v.muscle_group::public.muscle_group,
  v.video_url,
  v.cues,
  v.vigilance_points
from public.profiles p
cross join (
  values
  (
    E'Développé couché barre',
    E'haut_du_corps',
    E'https://static.exercisedb.dev/media/EIeI8Vf.gif',
    ARRAY[E'Allonge-toi à plat sur un banc, pieds au sol, dos collé au banc.', E'Saisis la barre en pronation, un peu plus large que la largeur des épaules.', E'Décroche la barre et tiens-la au-dessus de la poitrine, bras tendus.', E'Descends la barre lentement vers la poitrine, coudes rentrés.', E'Marque une courte pause au contact de la poitrine.', E'Pousse la barre vers le haut en tendant les bras.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : barre\nMuscles cibles : pectoraux\nSecondaires : triceps, épaules'
  ),
  (
    E'Développé incliné barre',
    E'haut_du_corps',
    E'https://static.exercisedb.dev/media/3TZduzM.gif',
    ARRAY[E'Règle un banc incliné à environ 45°.', E'Allonge-toi, pieds à plat au sol.', E'Saisis la barre en pronation, un peu plus large que les épaules.', E'Décroche la barre et descends-la vers la poitrine, coudes à 45°.', E'Marque une pause en bas, puis pousse jusqu’à la position de départ.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : barre\nMuscles cibles : pectoraux\nSecondaires : épaules, triceps'
  ),
  (
    E'Développé couché haltères',
    E'haut_du_corps',
    E'https://static.exercisedb.dev/media/SpYC0Kp.gif',
    ARRAY[E'Allonge-toi à plat sur un banc, pieds au sol, dos collé au banc.', E'Tiens un haltère dans chaque main, paumes vers l’avant, bras tendus au-dessus de la poitrine.', E'Descends les haltères de chaque côté de la poitrine, coudes à 90°.', E'Marque une pause, puis pousse jusqu’à tendre les bras.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : haltères\nMuscles cibles : pectoraux\nSecondaires : triceps, épaules'
  ),
  (
    E'Écarté haltères',
    E'haut_du_corps',
    E'https://static.exercisedb.dev/media/yz9nUhF.gif',
    ARRAY[E'Allonge-toi sur un banc, un haltère dans chaque main, paumes face à face.', E'Tends les bras au-dessus de la poitrine, coudes légèrement fléchis.', E'En gardant cette légère flexion, ouvre les bras en arc de cercle jusqu’à sentir l’étirement des pectoraux.', E'Marque une pause, puis ramène les haltères à la position de départ.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : haltères\nMuscles cibles : pectoraux\nSecondaires : épaules'
  ),
  (
    E'Pompes',
    E'haut_du_corps',
    E'https://static.exercisedb.dev/media/I4hDWkc.gif',
    ARRAY[E'Place-toi en planche haute, mains un peu plus larges que les épaules, pieds ensemble.', E'Gainage serré, descends le corps en fléchissant les coudes, corps aligné.', E'Pause quand la poitrine est juste au-dessus du sol, puis pousse pour tendre les bras.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : poids du corps\nMuscles cibles : pectoraux\nSecondaires : triceps, deltoïdes, gainage'
  ),
  (
    E'Dips pectoraux',
    E'haut_du_corps',
    E'https://static.exercisedb.dev/media/9WTm7dq.gif',
    ARRAY[E'Place-toi sur des barres parallèles, bras tendus, corps droit.', E'Descends en fléchissant les coudes jusqu’à ce que les épaules passent sous les coudes.', E'Pousse pour revenir en position haute, bras tendus.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : poids du corps\nMuscles cibles : pectoraux\nSecondaires : triceps, épaules'
  ),
  (
    E'Écarté poulie vis-à-vis',
    E'haut_du_corps',
    E'https://static.exercisedb.dev/media/Pr9Rhf4.gif',
    ARRAY[E'Fixe les poignées des poulies à hauteur de poitrine.', E'Pieds largeur d’épaules, dos à la machine.', E'Saisis les poignées en pronation, paumes vers l’avant.', E'Avance un peu pour mettre les câbles sous tension.', E'Garde le gainage et le dos droit pendant tout le mouvement.', E'Coudes légèrement fléchis, ramène les bras vers l’avant jusqu’à les rejoindre devant la poitrine.', E'Serre les pectoraux en fin de course.', E'Reviens lentement à la position de départ.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : poulie\nMuscles cibles : pectoraux\nSecondaires : deltoïdes, triceps'
  ),
  (
    E'Soulevé de terre',
    E'jambes',
    E'https://static.exercisedb.dev/media/ila4NZS.gif',
    ARRAY[E'Pieds largeur d’épaules, barre au sol devant toi.', E'Fléchis genoux et hanches, saisis la barre en pronation, mains un peu plus larges que les épaules.', E'Dos droit, poitrine ouverte : pousse dans les talons pour décoller la barre en étendant hanches et genoux.', E'En haut, serre les fessiers et reste gainé.', E'Redescends la barre en pliant hanches et genoux, dos toujours droit.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : barre\nMuscles cibles : fessiers\nSecondaires : ischio-jambiers, lombaires'
  ),
  (
    E'Soulevé de terre roumain',
    E'jambes',
    E'https://static.exercisedb.dev/media/wQ2c4XD.gif',
    ARRAY[E'Pieds largeur d’épaules, pointes vers l’avant.', E'Tiens la barre en pronation, mains un peu plus larges que les épaules.', E'Penche-toi à la hanche, dos droit, genoux légèrement fléchis.', E'Descends la barre le long des jambes, proche du corps.', E'Tu dois sentir l’étirement des ischio-jambiers.', E'Quand l’étirement est clair, pousse les hanches vers l’avant pour te redresser.', E'Serre les fessiers en haut.', E'Redescends et répète le nombre de répétitions prévu.']::text[],
    E'Équipement : barre\nMuscles cibles : fessiers\nSecondaires : ischio-jambiers, lombaires'
  ),
  (
    E'Rowing barre penché',
    E'haut_du_corps',
    E'https://static.exercisedb.dev/media/eZyBC3j.gif',
    ARRAY[E'Pieds largeur d’épaules, genoux légèrement fléchis.', E'Penche-toi à la hanche, dos droit, poitrine ouverte.', E'Saisis la barre en pronation, mains un peu plus larges que les épaules.', E'Tire la barre vers le bas de la poitrine en serrant les omoplates.', E'Pause en haut, puis redescends lentement.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : barre\nMuscles cibles : haut du dos\nSecondaires : biceps, avant-bras'
  ),
  (
    E'Rowing haltère unilatéral',
    E'haut_du_corps',
    E'https://static.exercisedb.dev/media/C0MA9bC.gif',
    ARRAY[E'Pieds largeur d’épaules, un haltère dans une main, paume vers le corps.', E'Genoux légèrement fléchis, penche-toi à la hanche, dos droit, gainage serré.', E'Laisse l’haltère pendre, bras tendu.', E'Tire l’haltère vers la hanche / poitrine, coude proche du corps, omoplates serrées.', E'Pause en haut, puis redescends lentement.', E'Termine les répétitions, puis change de côté.']::text[],
    E'Équipement : haltères\nMuscles cibles : haut du dos\nSecondaires : biceps, avant-bras'
  ),
  (
    E'Tirage horizontal',
    E'haut_du_corps',
    E'https://static.exercisedb.dev/media/fUBheHs.gif',
    ARRAY[E'Assieds-toi à la machine de tirage horizontal, pieds sur les cales, genoux légèrement fléchis.', E'Saisis les poignées en pronation, dos droit, épaules relâchées.', E'Tire vers le corps en serrant les omoplates.', E'Pause en fin de course, puis relâche lentement.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : poulie\nMuscles cibles : haut du dos\nSecondaires : biceps, avant-bras'
  ),
  (
    E'Tirage vertical',
    E'haut_du_corps',
    E'https://static.exercisedb.dev/media/LEprlgG.gif',
    ARRAY[E'Assieds-toi à la poulie haute, genoux calés sous les pads.', E'Saisis la barre en pronation, un peu plus large que les épaules.', E'Penche-toi légèrement en arrière, poitrine ouverte, bas du dos un peu cambré.', E'Tire la barre vers le haut de la poitrine en serrant les omoplates.', E'Pause en bas, puis laisse remonter lentement.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : poulie\nMuscles cibles : dorsaux\nSecondaires : biceps, rhomboïdes, deltoïdes postérieurs'
  ),
  (
    E'Tractions pronation',
    E'haut_du_corps',
    E'https://static.exercisedb.dev/media/lBDjFxJ.gif',
    ARRAY[E'Suspends-toi à la barre, paumes vers l’avant (pronation), bras tendus.', E'Gaine et serre les omoplates.', E'Tire le corps vers la barre en fléchissant les coudes, poitrine vers la barre.', E'Pause en haut, puis redescends lentement.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : poids du corps\nMuscles cibles : dorsaux\nSecondaires : biceps, avant-bras'
  ),
  (
    E'Tractions supination',
    E'haut_du_corps',
    E'https://static.exercisedb.dev/media/T2mxWqc.gif',
    ARRAY[E'Suspends-toi, paumes vers toi (supination), mains largeur d’épaules.', E'Gaine et tire le corps vers la barre, poitrine en avant.', E'Monte jusqu’à passer le menton au-dessus de la barre.', E'Pause en haut, puis redescends lentement.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : poids du corps\nMuscles cibles : dorsaux\nSecondaires : biceps, avant-bras'
  ),
  (
    E'Shrugs barre',
    E'haut_du_corps',
    E'https://static.exercisedb.dev/media/dG7tG5y.gif',
    ARRAY[E'Pieds largeur d’épaules, barre tenue devant toi en pronation.', E'Bras tendus, dos droit pendant tout le mouvement.', E'Monte les épaules vers les oreilles au maximum, serre les trapèzes en haut.', E'Marque une pause, puis redescends lentement.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : barre\nMuscles cibles : trapèzes\nSecondaires : épaules'
  ),
  (
    E'Extension lombaire',
    E'haut_du_corps',
    E'https://static.exercisedb.dev/media/zhMwOwE.gif',
    ARRAY[E'Règle le banc à hyperextension : haut des cuisses sur le pad, pieds calés.', E'Croise les bras sur la poitrine ou place les mains derrière la tête.', E'Descends le buste vers le sol en gardant le dos droit.', E'Pause en bas, puis remonte jusqu’à aligner le buste avec les jambes.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : poids du corps\nMuscles cibles : érecteurs du rachis\nSecondaires : fessiers, ischio-jambiers'
  ),
  (
    E'Squat arrière',
    E'jambes',
    E'https://static.exercisedb.dev/media/qXTaZnJ.gif',
    ARRAY[E'Pieds largeur d’épaules, pointes légèrement ouvertes.', E'Place la barre sur le haut du dos (trapèzes / deltoïdes postérieurs).', E'Gaine, poitrine ouverte, commence à descendre.', E'Fléchis genoux et hanches comme pour t’asseoir.', E'Descends jusqu’à cuisses parallèles au sol, ou un peu plus bas.', E'Genoux dans l’axe des pointes de pieds, poids sur les talons.', E'Pousse dans les talons pour te redresser.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : barre\nMuscles cibles : fessiers\nSecondaires : quadriceps, ischio-jambiers, mollets, gainage'
  ),
  (
    E'Squat avant',
    E'jambes',
    E'https://static.exercisedb.dev/media/zG0zs85.gif',
    ARRAY[E'Pieds largeur d’épaules, pointes légèrement ouvertes.', E'Place la barre devant, sur les clavicules et le haut des épaules.', E'Gaine, poitrine haute, descends en squat en reculant les hanches.', E'Va jusqu’à cuisses parallèles, ou aussi bas que confortable.', E'Pause en bas, puis pousse dans les talons pour remonter.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : barre\nMuscles cibles : fessiers\nSecondaires : quadriceps, ischio-jambiers, mollets, gainage'
  ),
  (
    E'Goblet squat',
    E'jambes',
    E'https://static.exercisedb.dev/media/yn8yg1r.gif',
    ARRAY[E'Pieds largeur d’épaules, haltère tenu verticalement contre la poitrine à deux mains.', E'Poitrine haute, gainage serré : descends en reculant les hanches et en fléchissant les genoux.', E'Continue jusqu’à cuisses parallèles, ou aussi bas que confortable.', E'Pause en bas, puis pousse dans les talons pour remonter.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : haltères\nMuscles cibles : quadriceps\nSecondaires : fessiers, ischio-jambiers, mollets'
  ),
  (
    E'Presse à cuisses',
    E'jambes',
    E'https://static.exercisedb.dev/media/10Z2DXU.gif',
    ARRAY[E'Règle le siège et le plateau de la presse dans une position confortable.', E'Assieds-toi, dos contre le dossier, pieds largeur d’épaules sur le plateau.', E'Tiens les poignées sur les côtés pour te stabiliser.', E'Pousse le plateau en tendant les jambes, talons restés au contact.', E'Va presque jusqu’à l’extension, sans verrouiller les genoux.', E'Pause en haut, puis redescends en fléchissant les genoux.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : presse / sled\nMuscles cibles : fessiers\nSecondaires : quadriceps, ischio-jambiers, mollets'
  ),
  (
    E'Fentes barre',
    E'jambes',
    E'https://static.exercisedb.dev/media/t8iSghb.gif',
    ARRAY[E'Debout, pieds largeur d’épaules, barre sur le haut du dos.', E'Fais un pas en avant avec le pied droit, buste droit.', E'Descends en fléchissant le genou avant jusqu’à cuisse parallèle au sol.', E'Pousse dans le talon droit pour revenir.', E'Enchaîne avec la jambe gauche, en alternance.']::text[],
    E'Équipement : barre\nMuscles cibles : fessiers\nSecondaires : quadriceps, ischio-jambiers, mollets'
  ),
  (
    E'Fentes marchées',
    E'jambes',
    E'https://static.exercisedb.dev/media/IZVHb27.gif',
    ARRAY[E'Pieds largeur d’épaules.', E'Avance la jambe droite et descends en fente.', E'Buste droit, genou avant aligné avec la cheville.', E'Pousse sur le pied droit et avance le gauche en fente.', E'Continue en marchant, rythme contrôlé.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : poids du corps\nMuscles cibles : fessiers\nSecondaires : quadriceps, ischio-jambiers, mollets'
  ),
  (
    E'Bulgarian split squat',
    E'jambes',
    E'https://static.exercisedb.dev/media/qx4fgX7.gif',
    ARRAY[E'Pieds largeur d’épaules, un haltère dans chaque main.', E'Place un pied devant, à plat, et l’autre en arrière sur un banc.', E'Descends en fléchissant genou et hanche avant, talon arrière décollé.', E'Va jusqu’à cuisse avant parallèle, puis pousse dans le talon avant pour remonter.', E'Termine les répétitions, puis change de jambe.']::text[],
    E'Équipement : haltères\nMuscles cibles : quadriceps\nSecondaires : fessiers, ischio-jambiers, mollets'
  ),
  (
    E'Hip thrust / pont fessier barre',
    E'jambes',
    E'https://static.exercisedb.dev/media/qKBpF7I.gif',
    ARRAY[E'Allonge-toi sur le dos, genoux fléchis, pieds à plat.', E'Place une barre sur les hanches et tiens-la à deux mains.', E'Serre fessiers et gainage, puis monte les hanches jusqu’à aligner genoux et épaules.', E'Pause en haut en serrant les fessiers.', E'Redescends lentement.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : barre\nMuscles cibles : fessiers\nSecondaires : ischio-jambiers, lombaires'
  ),
  (
    E'Leg extension',
    E'jambes',
    E'https://static.exercisedb.dev/media/my33uHU.gif',
    ARRAY[E'Règle la hauteur du siège et le dossier à ta morphologie.', E'Assieds-toi, dos contre le dossier, tibias contre le pad.', E'Tiens les poignées pour te stabiliser.', E'Tends les jambes en dépliant les genoux pour soulever la charge.', E'Pause en haut, puis redescends lentement.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : machine à levier\nMuscles cibles : quadriceps\nSecondaires : ischio-jambiers'
  ),
  (
    E'Leg curl allongé',
    E'jambes',
    E'https://static.exercisedb.dev/media/17lJ1kr.gif',
    ARRAY[E'Règle la machine et choisis la charge.', E'Allonge-toi à plat ventre, jambes tendues, talons contre le pad.', E'Tiens les poignées ou les côtés de la machine.', E'Sans bouger le buste, enroule les talons vers les fessiers, hanches collées au pad.', E'Serre les ischio-jambiers une seconde en haut.', E'Redescends lentement.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : machine à levier\nMuscles cibles : ischio-jambiers\nSecondaires : mollets'
  ),
  (
    E'Mollets debout',
    E'jambes',
    E'https://static.exercisedb.dev/media/6HmFgmx.gif',
    ARRAY[E'Place-toi sur le bord d’une marche, talons dans le vide, avant-pieds sur la marche.', E'Tiens une rampe ou un mur si besoin.', E'Monte les talons le plus haut possible, sur la pointe des pieds.', E'Pause en haut, puis redescends lentement.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : poids du corps\nMuscles cibles : mollets\nSecondaires : chevilles, pieds'
  ),
  (
    E'Mollets assis',
    E'jambes',
    E'https://static.exercisedb.dev/media/ipvgBnC.gif',
    ARRAY[E'Assieds-toi sur un banc, pieds au sol, barre posée sur les cuisses.', E'Place l’avant des pieds sur une cale ou une marche.', E'Descends les talons au maximum pour étirer les mollets.', E'Monte les talons le plus haut possible en contractant les mollets.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : barre\nMuscles cibles : mollets\nSecondaires : ischio-jambiers'
  ),
  (
    E'Développé militaire',
    E'haut_du_corps',
    E'https://static.exercisedb.dev/media/Kyd9Rz5.gif',
    ARRAY[E'Pieds largeur d’épaules, barre en pronation un peu plus large que les épaules.', E'Amène la barre à hauteur d’épaules, coudes légèrement en avant.', E'Pousse la barre au-dessus de la tête, bras tendus.', E'Redescends à hauteur d’épaules et répète.']::text[],
    E'Équipement : barre\nMuscles cibles : deltoïdes\nSecondaires : triceps, haut du dos'
  ),
  (
    E'Développé épaules haltères',
    E'haut_du_corps',
    E'https://static.exercisedb.dev/media/znQUdHY.gif',
    ARRAY[E'Assieds-toi sur un banc, un haltère sur chaque cuisse.', E'Monte les haltères à hauteur d’épaules, paumes vers l’avant.', E'Pousse au-dessus de la tête jusqu’à tendre les bras.', E'Pause en haut, puis redescends à hauteur d’épaules.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : haltères\nMuscles cibles : deltoïdes\nSecondaires : triceps, haut du dos'
  ),
  (
    E'Élévations latérales',
    E'haut_du_corps',
    E'https://static.exercisedb.dev/media/DsgkuIt.gif',
    ARRAY[E'Pieds largeur d’épaules, un haltère dans chaque main le long du corps.', E'Lève les bras sur les côtés jusqu’à hauteur d’épaules, coudes légèrement fléchis.', E'Pause en haut, puis redescends lentement.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : haltères\nMuscles cibles : deltoïdes\nSecondaires : trapèzes'
  ),
  (
    E'Élévations frontales',
    E'haut_du_corps',
    E'https://static.exercisedb.dev/media/3eGE2JC.gif',
    ARRAY[E'Pieds largeur d’épaules, haltères le long des cuisses, paumes vers toi.', E'Bras tendus, lève les haltères devant toi jusqu’à hauteur d’épaules.', E'Pause en haut, puis redescends lentement.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : haltères\nMuscles cibles : deltoïdes\nSecondaires : biceps, trapèzes'
  ),
  (
    E'Oiseau haltères',
    E'haut_du_corps',
    E'https://static.exercisedb.dev/media/mu5Guxt.gif',
    ARRAY[E'Pieds largeur d’épaules, un haltère dans chaque main, paumes vers le corps.', E'Genoux légèrement fléchis, penche-toi à la hanche, dos droit.', E'Ouvre les bras sur les côtés jusqu’à l’horizontale, coudes légèrement fléchis.', E'Pause en haut, puis redescends lentement.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : haltères\nMuscles cibles : deltoïdes\nSecondaires : trapèzes, rhomboïdes'
  ),
  (
    E'Développé Arnold',
    E'haut_du_corps',
    E'https://static.exercisedb.dev/media/Xy4jlWA.gif',
    ARRAY[E'Assieds-toi, dos calé, haltères à hauteur d’épaules, paumes vers toi, coudes fléchis.', E'Pousse vers le haut en tournant les poignets : en haut, paumes vers l’avant, bras tendus.', E'Cette rotation se fait pendant la montée.', E'Pause en haut, puis redescends à la position de départ.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : haltères\nMuscles cibles : deltoïdes\nSecondaires : triceps, haut des pectoraux'
  ),
  (
    E'Curl barre',
    E'haut_du_corps',
    E'https://static.exercisedb.dev/media/25GPyDY.gif',
    ARRAY[E'Debout, pieds largeur d’épaules, barre en supination, paumes vers l’avant.', E'Coudes collés au buste, enroule la barre en contractant les biceps.', E'Monte jusqu’à contraction maximale, barre à hauteur d’épaules.', E'Serre les biceps une seconde.', E'Redescends lentement.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : barre\nMuscles cibles : biceps\nSecondaires : avant-bras'
  ),
  (
    E'Curl haltères',
    E'haut_du_corps',
    E'https://static.exercisedb.dev/media/NbVPDMW.gif',
    ARRAY[E'Debout, un haltère dans chaque main, paumes vers l’avant, bras tendus.', E'Bras collés au corps, enroule les haltères en contractant les biceps.', E'Monte jusqu’à hauteur d’épaules.', E'Serre les biceps une seconde.', E'Redescends lentement.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : haltères\nMuscles cibles : biceps\nSecondaires : avant-bras'
  ),
  (
    E'Curl marteau',
    E'haut_du_corps',
    E'https://static.exercisedb.dev/media/slDvUAU.gif',
    ARRAY[E'Debout, un haltère dans chaque main, paumes vers le corps (prise marteau).', E'Coudes collés au buste.', E'C’est la position de départ.', E'Sans bouger les bras, enroule les haltères.', E'Monte jusqu’à hauteur d’épaules.', E'Serre les biceps une seconde.', E'Redescends lentement.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : haltères\nMuscles cibles : biceps\nSecondaires : avant-bras'
  ),
  (
    E'Pushdown triceps',
    E'haut_du_corps',
    E'https://static.exercisedb.dev/media/3ZflifB.gif',
    ARRAY[E'Fixe une barre droite à la poulie haute.', E'Face à la machine, pieds largeur d’épaules, genoux légèrement fléchis.', E'Saisis la barre en pronation, mains largeur d’épaules.', E'Coudes collés au corps, bras stables.', E'Pousse la barre vers le bas jusqu’à tendre les coudes.', E'Pause, puis remonte lentement.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : poulie\nMuscles cibles : triceps\nSecondaires : avant-bras'
  ),
  (
    E'Barre front',
    E'haut_du_corps',
    E'https://static.exercisedb.dev/media/iZop9xO.gif',
    ARRAY[E'Allonge-toi sur un banc, pieds au sol, tête vers l’extrémité du banc.', E'Barre en pronation, mains largeur d’épaules, bras tendus au-dessus de la poitrine.', E'Sans bouger les bras, descends la barre vers le front en fléchissant les coudes.', E'Pause en bas, puis tends les bras pour revenir.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : barre\nMuscles cibles : triceps\nSecondaires : épaules'
  ),
  (
    E'Dips triceps au banc',
    E'haut_du_corps',
    E'https://static.exercisedb.dev/media/RrLske5.gif',
    ARRAY[E'Assieds-toi au bord d’un banc, mains de chaque côté des hanches.', E'Avance le bassin hors du banc, jambes tendues, talons au sol.', E'Fléchis les coudes et descends le corps, dos proche du banc.', E'Pause en bas, puis pousse pour remonter.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : poids du corps\nMuscles cibles : triceps\nSecondaires : pectoraux, épaules'
  ),
  (
    E'Développé prise serrée',
    E'haut_du_corps',
    E'https://static.exercisedb.dev/media/J6Dx1Mu.gif',
    ARRAY[E'Allonge-toi à plat sur un banc, pieds au sol, dos collé au banc.', E'Saisis la barre en prise serrée, un peu plus étroite que les épaules.', E'Décroche et descends lentement vers la poitrine, coudes proches du corps.', E'Pause au contact de la poitrine.', E'Pousse jusqu’à tendre les bras.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : barre\nMuscles cibles : triceps\nSecondaires : pectoraux, épaules'
  ),
  (
    E'Planche (gainage)',
    E'gainage',
    E'https://static.exercisedb.dev/media/VBAWRPG.gif',
    ARRAY[E'Allonge-toi à plat ventre.', E'Avant-bras au sol, coudes sous les épaules.', E'Tends les jambes, pointes de pieds au sol.', E'Gaine et décolle le corps, en appui sur avant-bras et orteils.', E'Corps aligné de la tête aux talons.', E'Tiens la position le temps prévu.', E'Repose le corps au sol.', E'Répète si besoin.']::text[],
    E'Équipement : lesté\nMuscles cibles : abdominaux\nSecondaires : épaules, lombaires'
  ),
  (
    E'Crunch',
    E'gainage',
    E'https://static.exercisedb.dev/media/TFqbd8t.gif',
    ARRAY[E'Allonge-toi sur le dos, genoux fléchis, pieds à plat.', E'Mains derrière la tête, coudes ouverts.', E'Enroule les abdominaux et décolle les épaules vers les genoux.', E'Pause en haut, puis redescends lentement.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : poids du corps\nMuscles cibles : abdominaux\nSecondaires : fléchisseurs de hanche'
  ),
  (
    E'Relevé de jambes suspendu',
    E'gainage',
    E'https://static.exercisedb.dev/media/I3tsCnC.gif',
    ARRAY[E'Suspends-toi à la barre, bras tendus, paumes vers l’avant.', E'Gaine et lève les jambes tendues devant toi.', E'Monte jusqu’à l’horizontale, ou aussi haut que confortable.', E'Pause en haut, puis redescends lentement.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : poids du corps\nMuscles cibles : abdominaux\nSecondaires : fléchisseurs de hanche'
  ),
  (
    E'Russian twist',
    E'gainage',
    E'https://static.exercisedb.dev/media/XVDdcoj.gif',
    ARRAY[E'Assieds-toi au sol, genoux fléchis, pieds à plat.', E'Penche légèrement le buste en arrière, dos droit, gainage serré.', E'Mains jointes devant la poitrine, ou avec une charge.', E'Décolle les pieds si tu veux plus de difficulté.', E'Tourne le buste à droite.', E'Puis à gauche.', E'Alterne les côtés pour le nombre de répétitions prévu.']::text[],
    E'Équipement : poids du corps\nMuscles cibles : abdominaux\nSecondaires : obliques'
  ),
  (
    E'Mountain climbers',
    E'cardio',
    E'https://static.exercisedb.dev/media/RJgzwny.gif',
    ARRAY[E'Planche haute, mains sous les épaules, corps aligné.', E'Ramène le genou droit vers la poitrine, puis enchaîne avec le gauche.', E'Alterne comme une course, hanches basses, gainage serré.', E'Garde un rythme régulier et respire.', E'Continue le nombre de répétitions ou le temps prévu.']::text[],
    E'Équipement : poids du corps\nMuscles cibles : système cardiovasculaire\nSecondaires : gainage, épaules, triceps'
  ),
  (
    E'Burpees',
    E'cardio',
    E'https://static.exercisedb.dev/media/dK9394r.gif',
    ARRAY[E'Debout, pieds largeur d’épaules.', E'Descends en squat et pose les mains au sol.', E'Jette les pieds en arrière en position de pompe.', E'Fais une pompe, corps aligné.', E'Ramène les pieds en squat.', E'Saute explosif, bras au-dessus de la tête.', E'Réception souple, enchaîne la répétition suivante.']::text[],
    E'Équipement : poids du corps\nMuscles cibles : système cardiovasculaire\nSecondaires : quadriceps, ischio-jambiers, mollets, épaules, pectoraux'
  ),
  (
    E'Swing kettlebell',
    E'jambes',
    E'https://static.exercisedb.dev/media/UHJlbu3.gif',
    ARRAY[E'Pieds largeur d’épaules, pointes légèrement ouvertes.', E'Tiens le kettlebell à deux mains, bras tendus devant toi.', E'Genoux légèrement fléchis, recule les hanches.', E'Balance le kettlebell entre les jambes, bras tendus, dos plat.', E'Pousse les hanches vers l’avant pour monter le kettlebell à hauteur d’épaules.', E'Laisse-le redescendre entre les jambes et enchaîne.']::text[],
    E'Équipement : kettlebell\nMuscles cibles : fessiers\nSecondaires : ischio-jambiers, gainage'
  ),
  (
    E'Face pull',
    E'haut_du_corps',
    E'https://static.exercisedb.dev/media/wqNPGCg.gif',
    ARRAY[E'Fixe une corde à une poulie basse.', E'Face à la machine, pieds largeur d’épaules.', E'Saisis la corde, paumes face à face.', E'Genoux légèrement fléchis, penche-toi un peu à la hanche, dos droit.', E'Tire la corde vers le haut de la poitrine / le visage, omoplates serrées, coudes hauts.', E'Pause, puis reviens lentement.', E'Répète le nombre de répétitions prévu.']::text[],
    E'Équipement : poulie\nMuscles cibles : deltoïdes\nSecondaires : trapèzes, rhomboïdes, biceps'
  )
) as v(name, muscle_group, video_url, cues, vigilance_points)
where p.role = 'coach'
  and not exists (
    select 1
    from public.exercises e
    where e.coach_id = p.id
      and e.name = v.name
  );
