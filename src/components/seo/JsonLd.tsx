import React from "react";

interface PersonJsonLdProps {
  siteUrl?: string;
}

export function PersonJsonLd({
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://surajitborkotokey.com",
}: PersonJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${siteUrl}/#person`,
        name: "Prof. Surajit Borkotokey",
        givenName: "Surajit",
        familyName: "Borkotokey",
        jobTitle: "Professor of Mathematics",
        worksFor: {
          "@type": "EducationalOrganization",
          name: "Dibrugarh University",
          url: "https://dibru.ac.in",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Dibrugarh",
            addressRegion: "Assam",
            addressCountry: "IN",
          },
        },
        hasOccupation: [
          {
            "@type": "Occupation",
            name: "Professor of Mathematics",
            description: "Teaching, academic leadership, and advanced research in Cooperative Game Theory and Network Science.",
          },
          {
            "@type": "Occupation",
            name: "Dean, Student Affairs",
            description: "Executive administration and student welfare governance at Dibrugarh University.",
          },
          {
            "@type": "Occupation",
            name: "Director, Office of International Affairs",
            description: "International academic partnerships, exchange fellowships, and global university relations.",
          },
        ],
        alumniOf: [
          {
            "@type": "EducationalOrganization",
            name: "Corvinus University of Budapest",
            description: "Former Senior Visiting Research Fellow at Corvinus Institute for Advanced Studies (CIAS), Hungary.",
          },
          {
            "@type": "EducationalOrganization",
            name: "Louisiana State University",
            description: "Former Indo-US Research Fellow, Baton Rouge, Louisiana, USA.",
          },
        ],
        knowsAbout: [
          "Cooperative Game Theory",
          "Network Science",
          "Operations Research",
          "Multilinear Algebra",
          "Fuzzy Games",
          "Applied Mathematics",
          "Assamese Literature & Culture",
        ],
        description:
          "Prof. Surajit Borkotokey is a distinguished Professor of Mathematics at Dibrugarh University, Assam, India. Specializes in Cooperative Game Theory and Network Science, and publishes bilingual scholarly essays in English and Assamese.",
        image: `${siteUrl}/images/surajit-borkotokey-hero.jpg`,
        url: siteUrl,
        sameAs: [
          "https://scholar.google.com/citations?user=surajitborkotokey",
          "https://dibru.ac.in",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Prof. Surajit Borkotokey | Academic Portfolio & Bilingual Writings",
        description:
          "Official academic portfolio, mathematical research archive, and bilingual essays by Prof. Surajit Borkotokey.",
        publisher: {
          "@id": `${siteUrl}/#person`,
        },
        inLanguage: ["en", "as"],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BlogPostJsonLdProps {
  title: string;
  description: string;
  slug: string;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string;
  coverImage?: string | null;
  language: string;
  siteUrl?: string;
}

export function BlogPostJsonLd({
  title,
  description,
  slug,
  publishedAt,
  updatedAt,
  coverImage,
  language,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://surajitborkotokey.com",
}: BlogPostJsonLdProps) {
  const postUrl = `${siteUrl}/blog/${slug}`;
  const imageUrl = coverImage || `${siteUrl}/images/surajit-borkotokey-hero.jpg`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    headline: title,
    description: description,
    image: [imageUrl],
    datePublished: publishedAt ? new Date(publishedAt).toISOString() : undefined,
    dateModified: updatedAt ? new Date(updatedAt).toISOString() : undefined,
    inLanguage: language === "AS" ? "as" : "en",
    author: {
      "@type": "Person",
      name: "Prof. Surajit Borkotokey",
      url: siteUrl,
      jobTitle: "Professor of Mathematics",
      affiliation: {
        "@type": "EducationalOrganization",
        name: "Dibrugarh University",
      },
    },
    publisher: {
      "@type": "Person",
      name: "Prof. Surajit Borkotokey",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/images/surajit-borkotokey-hero.jpg`,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
