# DTI Accomplishments

An Astro site that renders articles and news authored through Sveltia CMS.

## Content types

| Type     | Folder            | URL                |
| :------- | :---------------- | :----------------- |
| Articles | `content/articles` | `/articles/<slug>/` |
| News     | `content/news`     | `/news/<slug>/`     |

Both content types support the same frontmatter:

| Field         | Required | Description                                      |
| :------------ | :------- | :----------------------------------------------- |
| `title`       | yes      | Post title.                                      |
| `date`        | yes      | Publication date (`YYYY-MM-DD`).                 |
| `description` | no       | Short summary shown on cards.                    |
| `author`      | no       | Author name.                                     |
| `image`       | no       | Cover image path, e.g. `/media/photo.jpg`.       |
| `gallery`     | no       | List of `{ image, caption }` items for carousel. |
| `tags`        | no       | List of topic labels.                            |

The Markdown body is rendered on the post page. Uploaded media is stored in
`public/media/` and served from `/media/...`.

## CMS accounts and roles

Sveltia CMS is Git-based, so it uses GitHub accounts rather than its own user
database. Roles are enforced by GitHub teams and branch protection:

- **Editors** — members of the `editors` GitHub team with repository **Write**
  access. They can create and edit articles/news, save them as pull requests,
  and mark them as ready. They cannot merge to `master`, but GitHub Write
  access does allow them to close any PR and delete its branch; see
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

The CMS uses the Editorial Workflow (`publish_mode` in
`public/admin/config.yml`):

1. An editor saves an article or news item. Sveltia opens a pull request.
2. The editor marks it **Ready**.
3. An admin reviews and merges the pull request, which publishes the post.

Sveltia does not provide role-based collection visibility with the GitHub
backend. The **Settings** singleton is therefore visible in the sidebar to
everyone, but changes to it can only be merged by admins because of the
CODEOWNERS + branch protection setup above. Later versions of Sveltia's
Additions feature are expected to add native role-based UI access.

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
auto_publish: false
```

When enabled, `.github/workflows/auto-publish-posts.yml` automatically
approves and merges article and news pull requests that:

- are marked ready (`sveltia-cms/pending_publish`),
- were opened by a user with editor **Write** access (admins use the normal
  review flow),
- only change files under `content/articles/`, `content/news/`, or
  `public/media/`.

Settings and code changes are never auto-published.

### Testing auto-publish

1. Confirm `auto_publish: true` is on `master`.
2. Push the workflow changes to `master` first, so GitHub registers the
   `workflow_dispatch` trigger.
3. Either:
   - create a throwaway article or news item from an **editor** account, save
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

- `Header.astro`, `Footer.astro` — site chrome.
- `PostCard.astro` — article/news card with type badge.
- `PostArchive.astro` — shared archive page for `/articles` and `/news`.
- `PostView.astro` — shared post page with Markdown, gallery, TOC, and prev/next.
- `ImageCarousel.astro` — accessible image carousel with dots, arrows, and swipe.
- `BaseLayout.astro` — HTML shell, metadata, and global styles.

## Commands

| Command           | Action                                           |
| :---------------- | :----------------------------------------------- |
| `npm install`     | Install dependencies.                            |
| `npm run dev`     | Start the dev server at `localhost:4321`.        |
| `npm run build`   | Build the production site to `./dist/`.          |
| `npm run preview` | Preview the production build.                    |
| `npm run astro`   | Run Astro CLI commands like `astro check`.       |

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

Production does not pull from Git. `.github/workflows/deploy.yml` runs on every
push to `master` — including merges from the editorial workflow and
auto-published posts — builds the site, uploads `dist/` over SSH, and
atomically switches the live symlink.

The deployment layout on the VPS is:

```text
/var/www/dti-accomp/
├── releases/
│   ├── <commit-sha>/
│   └── ...
└── current -> releases/<latest-commit-sha>
```

Point nginx or Caddy at `/var/www/dti-accomp/current`.

### Server prerequisites

- A dedicated deploy user, e.g. `deploy`.
- `rsync` installed on the server.
- Write access for the deploy user to `DEPLOY_PATH`.
- An SSH key authorized for the deploy user.

```sh
sudo mkdir -p /var/www/dti-accomp/releases
sudo chown -R deploy:deploy /var/www/dti-accomp
```

### GitHub repository secrets

Add these under **Settings → Secrets and variables → Actions** (or the
`production` environment):

| Secret               | Required | Value                                                    |
| :------------------- | :------- | :------------------------------------------------------- |
| `DEPLOY_HOST`        | yes      | Server hostname or IP.                                   |
| `DEPLOY_USER`        | yes      | SSH user, e.g. `deploy`.                                 |
| `DEPLOY_SSH_KEY`     | yes      | Private key for the deploy user.                         |
| `DEPLOY_PATH`        | yes      | Absolute path, e.g. `/var/www/dti-accomp`.               |
| `DEPLOY_PORT`        | no       | SSH port. Defaults to `22`.                              |
| `DEPLOY_KNOWN_HOSTS` | no       | Pre-pinned `known_hosts` entry. Otherwise uses keyscan.  |

After a merge, the flow is:

```text
Editor saves → PR → admin merges (or auto-publish merges)
→ push to master
→ deploy.yml builds dist/
→ rsync to releases/<sha>
→ current symlink switches
→ live site updated
```

Use **Actions → Deploy production → Run workflow** to redeploy `master`
manually.


