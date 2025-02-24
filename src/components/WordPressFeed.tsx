import React, { useState, useEffect } from "react";

interface Post {
  id: number;
  link: string;
  title: { rendered: string };
  date: string;
  excerpt: { rendered: string };
  content: { rendered: string };
}

let apiUrl = ""
apiUrl = `https://marina-services.com/wordpress/`;
let pageSize = 6; // Fetch 6 posts initially
const postsToShow = 3;
let postsToShowAdjust = 1;
let postsPageNumber = 1;

function WordPressFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(2);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [fetchingSpecificPost, setFetchingSpecificPost] = useState(false);
  const [visiblePostsCount, setVisiblePostsCount] = useState(postsToShow); // Initially show 3 posts
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const [totalPosts, setTotalPosts] = useState<number>(0);
  const [postData, setPostData] = useState<Post | null>(null); // New state for specific post data

  useEffect(() => {
    fetch(`${apiUrl}/wp-json/wp/v2/posts?per_page=1`)
      .then((response) => response.headers.get("X-WP-Total"))
      .then((count) => {
        if (count !== null) {
          setTotalPosts(parseInt(count));
        }
      })
      .catch((error) => {
        setError(error.message);
      });
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/wp-json/wp/v2/posts?page=${postsPageNumber}&per_page=${pageSize}`
        );
        const data = await response.json();
        setPosts((prevPosts) => [...prevPosts, ...data]); // Append new data to existing posts
        setLoading(false);
      } catch (error) {
        // setError(error.message);
        setLoading(false);
      }
    };

    fetchPosts();
  }, [pageNumber]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get("p");
    if (postId && !isNaN(parseInt(postId))) {
      setSelectedPostId(postId);
      // Check if the post is already in the state
      const selectedPost = posts.find((post) => post.id.toString() === postId);
      if (selectedPost) {
        setPostData(selectedPost); // Set the specific post data from existing posts
      } else {
        setFetchingSpecificPost(true);
        fetch(`${apiUrl}/wp-json/wp/v2/posts/${postId}`)
          .then((response) => {
            if (response.status === 404) {
              window.location.replace("./");
              return;
            }
            return response.json();
          })
          .then((data) => {
            setPostData(data); // Set the specific post data
            setFetchingSpecificPost(false);
          })
          .catch((error) => {
            setError(error.message);
            setFetchingSpecificPost(false);
          });
      }
    } else {
      setSelectedPostId(null);
      // setVisiblePostsCount(postsToShow); // Reset visiblePostsCount when returning to feed
      setPostData(null); // Clear postData when not viewing a specific post
    }
  }, [posts]); // Added dependency on posts

  useEffect(() => {
    // Listen for changes in the URL
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const postId = urlParams.get("p");
      setSelectedPostId(postId);
      if (!postId) {
        // setVisiblePostsCount(postsToShow); // Reset visiblePostsCount when returning to feed
        setPostData(null); // Clear postData when not viewing a specific post
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    // Update document title and meta description based on selectedPostId
    if (selectedPostId && postData) {
      document.title = `${postData.title.rendered} - WordPress Feed`;
      const metaDescription = document.querySelector(
        'meta[name="description"]'
      );
      if (metaDescription) {
        metaDescription.setAttribute(
          "content",
          postData.excerpt.rendered.replace(/<[^>]*>/g, "")
        );
      }
    } else {
      document.title = "WordPress Feed";
      const metaDescription = document.querySelector(
        'meta[name="description"]'
      );
      if (metaDescription) {
        metaDescription.setAttribute(
          "content",
          "Browse the latest posts from our WordPress feed."
        );
      }
    }
  }, [selectedPostId, postData]);

  const handleReadMoreClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string
  ) => {
    e.preventDefault();
    setScrollPosition(window.scrollY); // Store current scroll position
    window.scrollTo(0, 0); // Scroll to top
    window.history.pushState({}, "", `?p=${id}`);
    setSelectedPostId(id);

    // Check if the post is already in the state
    const selectedPost = posts.find((post) => post.id.toString() === id);
    if (selectedPost) {
      setPostData(selectedPost); // Set the specific post data from existing posts
    } else {
      setFetchingSpecificPost(true);
      fetch(`${apiUrl}/wp-json/wp/v2/posts/${id}`)
        .then((response) => response.json())
        .then((data) => {
          setPostData(data); // Set the specific post data
          setFetchingSpecificPost(false);
        })
        .catch((error) => {
          setError(error.message);
          setFetchingSpecificPost(false);
        });
    }
  };

  const handleReturnToFeedClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.history.pushState({}, "", "./");
    setSelectedPostId(null);
    setTimeout(() => {
      window.scrollTo(0, scrollPosition); // Scroll back to stored position
    }, 100); // Small delay to ensure the page has time to render
  };

  if (loading || fetchingSpecificPost) return <div>Loading...</div>;

  if (selectedPostId && postData) {
    return (
      <div className="wordpress-post flex flex-col gap-4 p-6 max-w-screen-sm m-auto">
        <h1 className="text-4xl text-blue-600 font-bold">
          {postData.title.rendered}
        </h1>
        <p className="text-sm text-gray-600 mt-2 mb-2">
          {new Date(postData.date).toLocaleDateString()}
        </p>
        <div
          className="space-y-4"
          dangerouslySetInnerHTML={{
            __html: postData.content.rendered,
          }}
        />
        <div>
          <a
            href="./"
            onClick={handleReturnToFeedClick}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded no-underline inline-block"
          >
            Return to Feed
          </a>
        </div>
      </div>
    );
  }

  let visiblePosts = posts.slice(0, visiblePostsCount);

  return (
    <div className="wordpress-feed flex flex-col gap-4 p-6 max-w-screen-sm m-auto">
      <h1 className="text-4xl text-blue-600 font-bold ml-6">WordPress Feed</h1>
      {visiblePosts.map((post, index) => (
        <div key={index} className="bg-gray-200 rounded-lg p-6">
          <h2 className="text-2xl text-blue-600 font-bold">
            {post.title.rendered}
          </h2>
          <p className="text-sm text-gray-600 mt-2 mb-2">
            {new Date(post.date).toLocaleDateString()}
          </p>
          <div
            dangerouslySetInnerHTML={{
              __html: post.excerpt.rendered,
            }}
          />
          <div className="mt-4">
            <a
              href={`./?p=${post.id.toString()}`}
              onClick={(e) => handleReadMoreClick(e, post.id.toString())}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded no-underline inline-block"
            >
              Read More
            </a>
          </div>
        </div>
      ))}
      {visiblePostsCount < totalPosts && (
        <div className="p-6">
          <button
            onClick={() => {
              pageSize = postsToShow;
              postsPageNumber = postsPageNumber + postsToShowAdjust + 1;
              console.log(`postsPageNumber`, postsPageNumber);
              postsToShowAdjust = 0;

              console.log(
                "PRE visiblePostsCount",
                visiblePostsCount,
                `posts.length`,
                posts.length
              );
              setVisiblePostsCount(visiblePostsCount + postsToShow);
              console.log(
                "visiblePostsCount",
                visiblePostsCount,
                `posts.length`,
                posts.length,
                `totalPosts`,
                totalPosts
              );
              if (totalPosts > posts.length) {
                setPageNumber(postsPageNumber + 1);
              }
            }}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}

export default WordPressFeed;
