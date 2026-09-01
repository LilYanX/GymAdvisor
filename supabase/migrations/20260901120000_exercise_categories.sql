-- Nouvelles catégories d'exercices pour la bibliothèque partagée

alter table public.exercises
  alter column muscle_group type text using muscle_group::text;

drop type public.muscle_group;

create type public.muscle_group as enum (
  'jambe',
  'push',
  'pull',
  'core',
  'cardio',
  'mobilite',
  'balistique',
  'pliometrie'
);

alter table public.exercises
  alter column muscle_group type public.muscle_group using (
    case muscle_group
      when 'jambes' then 'jambe'
      when 'cardio' then 'cardio'
      when 'gainage' then 'core'
      when 'full_body' then 'core'
      when 'haut_du_corps' then 'push'
      else 'core'
    end
  )::public.muscle_group;

update public.exercises
set muscle_group = 'pull'
where name in (
  'Rowing barre penché',
  'Rowing haltère unilatéral',
  'Tirage horizontal',
  'Tirage vertical',
  'Tractions pronation',
  'Tractions supination',
  'Face pull',
  'Shrugs barre',
  'Extension lombaire',
  'Curl barre',
  'Curl haltères',
  'Curl marteau',
  'Oiseau haltères'
);

update public.exercises
set muscle_group = 'jambe'
where name in (
  'Soulevé de terre',
  'Soulevé de terre roumain',
  'Squat arrière',
  'Squat avant',
  'Goblet squat',
  'Presse à cuisses',
  'Fentes barre',
  'Fentes marchées',
  'Bulgarian split squat',
  'Hip thrust / pont fessier barre',
  'Leg extension',
  'Leg curl allongé',
  'Mollets debout',
  'Mollets assis'
);

update public.exercises
set muscle_group = 'push'
where name in (
  'Développé couché barre',
  'Développé incliné barre',
  'Développé couché haltères',
  'Écarté haltères',
  'Pompes',
  'Dips pectoraux',
  'Écarté poulie vis-à-vis',
  'Développé militaire',
  'Développé épaules haltères',
  'Élévations latérales',
  'Élévations frontales',
  'Développé Arnold',
  'Pushdown triceps',
  'Barre front',
  'Dips triceps au banc',
  'Développé prise serrée'
);

update public.exercises
set muscle_group = 'core'
where name in (
  'Planche (gainage)',
  'Crunch',
  'Relevé de jambes suspendu',
  'Russian twist'
);

update public.exercises
set muscle_group = 'cardio'
where name in (
  'Mountain climbers'
);

update public.exercises
set muscle_group = 'balistique'
where name in (
  'Swing kettlebell'
);

update public.exercises
set muscle_group = 'pliometrie'
where name in (
  'Burpees'
);

create index if not exists exercises_muscle_group_idx on public.exercises (muscle_group);
