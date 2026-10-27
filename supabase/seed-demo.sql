-- Seed DÉMO optionnel (is_demo = true). Remplacer YOUR_FAMILY_ID par l’id d’une famille de test.
-- Supprimer : delete from events where is_demo; delete from rituals where is_demo; delete from goals where is_demo;
insert into public.events(family_id, title, category, date, start_time, end_time, recurrence, is_demo)
values ('YOUR_FAMILY_ID', 'Dîner en famille (démo)', 'family', current_date, '19:00', '20:00', 'daily', true);
insert into public.rituals(family_id, title, slot, items, is_demo)
values ('YOUR_FAMILY_ID', 'Bilan du soir (démo)', 'evening', array['Un merci chacun','Le meilleur moment du jour','Préparer demain'], true);
