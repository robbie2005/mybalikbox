-- Ensure post-media bucket allows public reads (fixes broken feed images if bucket was private).

begin;

update storage.buckets
set public = true
where id = 'post-media';

commit;
