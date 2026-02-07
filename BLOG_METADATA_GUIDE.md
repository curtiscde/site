# Blog Post Metadata Guide

This guide explains the metadata fields used in blog posts to ensure proper social media previews and search engine optimization.

## Required Fields

Every blog post must have these fields in the frontmatter (YAML at the top of the .md file):

```yaml
---
id: 1733579828812          # Unique numeric ID (timestamp recommended)
title: "Post Title"         # The main title of your post
slug: "post-slug"          # URL-friendly slug (lowercase, hyphens, no spaces)
date: 2024-12-07T12:00:00  # Publication date in ISO format
tags: ["tag1", "tag2"]     # Array of tags for categorization
content: "..."             # The actual post content (handled automatically)
---
```

## Optional Fields

These fields enhance social media previews and search results:

```yaml
---
description: "A brief summary..."  # SEO description and social media preview text
                                    # Recommended: 150-160 characters
                                    # Used for meta description and OG/Twitter cards

image: "/post/slug/image.png"       # Featured image path
                                    # Used for Open Graph and Twitter Card previews
                                    # Recommended size: 1200x630px for best results
                                    # Supported formats: PNG, JPG, WebP

author: "Curtis Timson"             # Author name (defaults to "Curtis Timson" if not specified)
                                    # Used in JSON-LD structured data
---
```

## Example Complete Post

```markdown
---
title: "My Amazing Blog Post"
slug: "my-amazing-blog-post"
date: 2024-12-20T10:30:00
description: "Learn how to do something amazing in just 5 minutes. Perfect for beginners."
tags: ["tutorial", "javascript", "beginner"]
image: "/post/my-amazing-blog-post/featured.png"
author: "Curtis Timson"
id: 1734158400000
---

# My Amazing Blog Post

Your content starts here...
```

## Social Media Preview Fields

The following metadata is automatically generated from these fields:

### Twitter/X Preview
- **Title**: Uses the `title` field
- **Description**: Uses the `description` field
- **Image**: Uses the `image` field (recommended 1200x630px)
- **Card Type**: Summary Large Image (when image is present)
- **Creator**: @curtcode (automatically set)

### Facebook/LinkedIn Preview
- **Title**: Uses the `title` field
- **Description**: Uses the `description` field
- **Image**: Uses the `image` field with proper dimensions
- **Image Alt Text**: Uses the `title` field
- **Publish Date**: Uses the `date` field

### Google Search Results & Rich Snippets
- **Title**: Uses the `title` field
- **Description**: Uses the `description` field
- **Author**: Uses the `author` field (if provided)
- **Publish Date**: Uses the `date` field
- **Tags/Keywords**: Uses the `tags` field

## Image Guidelines

For best results with social media previews:

1. **Dimensions**: 1200x630 pixels
2. **File Size**: Keep under 100KB for optimal loading
3. **Format**: PNG or JPG recommended
4. **Format**: WebP for smaller file sizes (with JPG fallback)
5. **Location**: Store in `/public/post/{slug}/` directory
6. **Naming**: Use descriptive names like `featured.png` or `cover.jpg`

## Best Practices

1. **Always provide a description**: It's crucial for social media previews and SEO. Keep it concise and compelling.

2. **Use descriptive images**: A good featured image increases click-through rates on social media.

3. **Choose relevant tags**: Use 2-5 tags that accurately describe the post content. Tags help with discovery and organization.

4. **Format dates correctly**: Use ISO 8601 format: `YYYY-MM-DDTHH:MM:SS`

5. **Create unique slugs**: Make slugs descriptive and SEO-friendly. They become part of the post URL.

6. **Keep titles clear**: The title appears in browser tabs, search results, and social media cards. Keep it clear and compelling.

## Technical Details

### JSON-LD Structured Data

Blog posts automatically include JSON-LD structured data of type `BlogPosting` which helps:
- Google and other search engines better understand your content
- Enables rich snippets in search results
- Improves SEO and discoverability

### Open Graph Tags

The following Open Graph tags are automatically set:
- `og:type`: article
- `og:title`: Post title
- `og:description`: Post description
- `og:image`: Featured image with dimensions (1200x630)
- `og:image:alt`: Post title as alt text
- `og:url`: Full post URL (canonical)
- `og:site_name`: Site title
- `article:published_time`: Publication date

### Twitter Card Tags

The following Twitter-specific tags are automatically set:
- `twitter:card`: summary_large_image
- `twitter:title`: Post title
- `twitter:description`: Post description
- `twitter:image`: Featured image
- `twitter:creator`: @curtcode

## Troubleshooting

### Social media preview not showing the image?
- Ensure the image path is correct and file exists
- Check that the image is at least 1200x630px
- Try regenerating the social media preview cache (usually takes 24 hours)

### Description not appearing in preview?
- Make sure you've added the `description` field to frontmatter
- Keep it under 160 characters for best display
- Avoid special characters that might break metadata

### Tags not showing?
- Ensure you're using the correct YAML array syntax: `["tag1", "tag2"]`
- Tags should be lowercase and hyphen-separated

## Testing Your Metadata

After publishing a post, test it with:
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/sharing/)
- [Twitter Card Validator](https://card-validator.twitter.com/)
- [Schema.org Rich Results Test](https://search.google.com/test/rich-results)

## Updating Existing Posts

To update existing posts with metadata:
1. Add missing fields (description, image, author) to the frontmatter
2. If adding an image, follow the guidelines above
3. Commit and push the changes
4. The site will rebuild automatically
5. Clear social media caches by running the tools above
