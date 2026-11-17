# DTI Accomplishments

An Astro site that renders accomplishments authored through Sveltia CMS.

## Content types

| Type                    | Folder             | URL                          |
| :---------------------- | :----------------- | :--------------------------- |
| Accomplishments         | `content/articles` | `/articles/<slug>/`          |
| Province / Office pages | `content/offices`  | `/accomplishments/<office>/` |

The list of all accomplishments is at `/accomplishments/`. Each Province / Office
page (`/accomplishments/<office>/`) lists every accomplishment whose
**Province / Office** matches it, so posts sort themselves onto the right page.
The optional `content/offices/<office>.md` file only sets the banner title
(`name`).

Accomplishments support this frontmatter:

| Field      | Required | Description                                                                                             |
| :--------- | :------- | :------------------------------------------------------------------------------------------------------ |
| `title`    | yes      | Post title.                                                                                             |
| `date`     | yes      | Publication date (`YYYY-MM-DD`).                                                                        |
| `province` | no       | One province/office, shown as a location badge. Decides which office page the post appears on.        |
| `image`    | no       | Main photo path, e.g. `/media/photo.jpg`. Its alt text comes from the file name.                        |
| `photos`   | no       | Up to 4 `{ image, caption, size, side, after }` photos placed inside the text.                          |
| `author`   | no       | Author name, shown under the text.                                                                      |
| `tags`     | no       | List of topic labels.                                                                                   |

The Markdown `body` is required and is rendered on the post page. The first
paragraph is used as the summary on cards and in link previews. Uploaded media
is stored in `public/media/` and served from `/media/...`.

Select-field options are defined in `public/admin/config.yml`:

- **Province / Office:** Regional Office, Bukidnon, Camiguin, Lanao del Norte,
  Misamis Occidental, Misamis Oriental.
- **Tags:** Trade, MSMEs, Consumer, Advisories, Programs, Events, Awards,
  Financing.

## CMS accounts and roles

Sveltia CMS is Git-based, so it uses GitHub accounts rather than its own user
database. Roles are enforced by GitHub teams and branch protection:

- **Editors** — members of the `editors` GitHub team with repository **Write**
  access. They can create and edit accomplishments, save them as pull requests,
  and set the status to **Ready**. They cannot merge to `master`, but GitHub
  Write access does allow them to close any PR and delete its branch; see
  [Pull request deletion and recovery](#pull-request-deletion-and-recovery).
- **Admins** — members of the `admins` GitHub team with repository **Admin** or
  **Maintain** access. They review and merge/publish pull requests.

Configure the `master` branch protection/ruleset with:

1. Require a pull request before merging.
2. Require at least one approval.
3. Require review from Code Owners.
4. Restrict who can push/merge to the `admins` team (or add only `admins` to the
   ruleset bypass list).

`.github/CODEOWNERS` marks the admin-only areas: site settings, the CMS config,
and the GitHub automation. Replace `@DTI10/admins` there with the real team
handle if it differs.

### Publishing workflow

Accomplishments use the Editorial Workflow (configured on the collection with
`publish_mode` in `public/admin/config.yml`):

1. An editor saves an accomplishment. Sveltia opens a pull request.
2. The editor sets the **Status** button at the top right to **Ready**.
3. An admin reviews and merges the pull request, which publishes the post.

Each collection’s `description` in `public/admin/config.yml` reminds editors
of these steps inside the CMS. Editors cannot merge to `master`; branch
protection blocks it, so the CMS Publish action fails for them.

The **Settings** singleton is deliberately different. Singletons always follow
the top-level `publish_mode`, which is set to `simple`, so pressing **Save** in
Settings commits directly to `master` and publishes immediately — there is no
draft → Ready → Publish pipeline. Only admins can do this, because branch
protection restricts pushes/merges to `master` to the admins team. An editor
who opens Settings can still see it, but saving fails with a GitHub permission
error. CODEOWNERS continues to mark `content/settings/` as admin-owned.

Sveltia does not provide role-based collection visibility with the GitHub
backend. Later versions of Sveltia's Additions feature are expected to add
native role-based UI access.

### Pull request deletion and recovery

Editors with **Write** access can close any pull request and delete its
`cms/**` branch. Sveltia’s **Discard** action on the Editorial Workflow page
uses those GitHub permissions, so the CMS cannot stop an editor from
discarding someone else’s PR. `delete: false` does not help: it disables
deleting entries, but discarding unpublished changes is still allowed.

To make accidental or malicious discards recoverable:

1. `.github/workflows/restore-closed-prs.yml` runs when a PR is closed without
   merging. If the closer is not the PR author and does not have
   admin/maintain access, it:
   - restores the deleted branch from the PR’s head commit;
   - reopens the pull request;
   - comments on the PR explaining why it was reopened.
2. Add a repository ruleset targeting `cms/**` that restricts branch deletion
   to admins, so the branch survives long enough to restore.
3. Keep `AUTO_PUBLISH_TOKEN` configured. The workflow uses it for the restore,
   falling back to `GITHUB_TOKEN` if it is missing.

The workflow uses `pull_request_target` because it needs secrets. It never
checks out or runs code from the pull request.

This is recovery, not prevention. For true prevention, editors need
**Read** access and fork-based Open Authoring, which changes the review flow
and auto-publish setup.

## Settings and auto-publishing

The **Settings** singleton writes to `content/settings/settings.yml`:

```yaml
auto_publish: true
```

When enabled, `.github/workflows/auto-publish-posts.yml` automatically
approves and merges accomplishment pull requests that:

- are marked ready (`sveltia-cms/pending_publish`),
- were opened by a user with editor **Write** access (admins use the normal
  review flow),
- only change files under `content/articles/` or
  `public/media/`.

Settings and code changes are never auto-published.

### Testing auto-publish

1. Confirm `auto_publish: true` is on `master`.
2. Push the workflow changes to `master` first, so GitHub registers the
   `workflow_dispatch` trigger.
3. Either:
   - create a throwaway accomplishment from an **editor** account, save
     it, and mark it **Ready**; or
   - open **Actions → Auto-publish editor posts → Run workflow** and enter the
     number of an open, ready PR.
4. Open the workflow run and check the **Summary** tab. It reports whether the
   PR was merged or why it was skipped.

Enabling the toggle does not retroactively process PRs that were already ready.
Trigger a new event by re-saving the entry, removing/re-adding the
`sveltia-cms/pending_publish` label, or using the manual workflow run.
`AUTO_PUBLISH_TOKEN` must be a **repository** secret (or an environment secret
if the workflow uses that environment).

To enable the automation, add a repository secret named `AUTO_PUBLISH_TOKEN`.
Use a personal access token from an **admin** account with:

- **Contents:** Read and write
- **Pull requests:** Read and write
- **Metadata:** Read (added automatically)

Classic tokens need the `repo` scope. If the organization enforces SSO, authorize
the token for the organization. Fine-grained tokens must also be scoped to this
repository. Without the secret, the workflow exits without merging.

## Components

- `Nav.astro`, `Footer.astro` — site chrome, including the mobile menu.
- `BackToTop.astro` — scroll-to-top button with reading progress.
- `RecentAccomplishments.astro` — home page accomplishments grid.
- `PostList.astro` — card grid with search, province/office and year filters.
- `PostCard.astro` — accomplishment card with date stamp.
- `PostArchive.astro` — list page for `/accomplishments`.
- `PostView.astro` — post page with Markdown text, inline photos and a
  "More accomplishments" strip.
- `gallery/FeaturedHero.tsx` — home page hero carousel for the latest posts.
- `pages/accomplishments/[office].astro` — Province / Office pages.
- `BaseLayout.astro` — HTML shell, metadata, and global styles.

## Commands

| Command           | Action                                     |
| :---------------- | :----------------------------------------- |
| `npm install`     | Install dependencies.                      |
| `npm run dev`     | Start the dev server at `localhost:4321`.  |
| `npm run build`   | Build the production site to `./dist/`.    |
| `npm run preview` | Preview the production build.              |
| `npm run astro`   | Run Astro CLI commands like `astro check`. |

The CMS is available at `/admin/`.

### Local development and CMS changes

Sveltia CMS commits published changes to GitHub, not to your local working
copy. Pull before starting the dev server to see content published through the
CMS:

```sh
git pull
npm run dev
```

If the local repository has uncommitted changes, commit or stash them first so
the pull can apply cleanly.

## Production deployment

Production is containerized. `.github/workflows/deploy.yml` runs on every push
to `master` — including merges from the editorial workflow and auto-published
posts — on a **self-hosted runner installed on the production host**. The runner
checks out the repository, then `docker compose up -d --build` builds the site
inside the Docker image and starts it behind a Caddy reverse proxy.

```text
compose.yaml
├── web    → multi-stage Dockerfile: Node builds Astro, nginx serves dist/
└── caddy  → reverse proxy on :80/:443, automatic HTTPS for SITE_ADDRESS
```

The build happens inside the image (`npm ci && npm run build`), so the runner
only needs Docker with the Compose plugin — not Node, rsync, or SSH keys.

### Server prerequisites

- A self-hosted GitHub Actions runner registered for this repository and
  labelled `self-hosted` (default labels are fine).
- Docker Engine with the Compose v2 plugin, usable by the runner's user.
- Ports 80 and 443 reachable from the internet (or another edge proxy).

Bring the stack up manually once to seed the Caddy volumes and DNS/TLS:

```sh
SITE_ADDRESS=example.com docker compose up -d --build
```

### Configuration

Set these as **repository variables** under **Settings → Secrets and variables
→ Actions → Variables** (or on the `production` environment). They are read by
`compose.yaml`; defaults shown are used when unset.

| Variable       | Required | Default     | Value                                               |
| :------------- | :------- | :---------- | :-------------------------------------------------- |
| `SITE_ADDRESS` | no       | `localhost` | Public hostname, e.g. `dti-accomp.example.com`.     |
| `HTTP_PORT`    | no       | `80`        | Host port for plain HTTP (ACME + redirect).         |
| `HTTPS_PORT`   | no       | `443`       | Host port for HTTPS.                                |

Point DNS for `SITE_ADDRESS` at the host before the first deploy so Caddy can
issue a certificate. For local testing, `SITE_ADDRESS=:80` serves plain HTTP
without certificates.

After a merge, the flow is:

```text
Editor saves → Status: Ready → PR → admin merges (or auto-publish merges)
→ push to master
→ self-hosted runner checks out the repo
→ docker compose builds the image (npm ci && astro build)
→ web container starts, Caddy proxies to it
→ live site updated
```

Saving **Settings** skips this pipeline: it commits straight to `master`, which
also triggers `deploy.yml`.

Use **Actions → Deploy production → Run workflow** to redeploy `master`
manually.
