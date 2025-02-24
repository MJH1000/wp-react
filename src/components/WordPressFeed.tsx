import React, { useState, useEffect } from "react";

interface Post {
  id: number;
  link: string;
  title: { rendered: string };
  date: string;
  excerpt: { rendered: string };
  content: { rendered: string };
}

let apiUrl = "https://taylorau.com.au";
apiUrl = "https://test.frontity.org";
apiUrl = `https://marina-services.com/wordpress/`;
const pageSize = 6; // Fetch 6 posts initially

function WordPressFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [fetchingSpecificPost, setFetchingSpecificPost] = useState(false);
  const [visiblePostsCount, setVisiblePostsCount] = useState(3); // Initially show 3 posts
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const [totalPosts, setTotalPosts] = useState<number>(0);

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
    fetch(
      `${apiUrl}/wp-json/wp/v2/posts?page=${pageNumber}&per_page=${pageSize}`
    )
      .then((response) => response.json())
      .then((data) => {
        if (pageNumber === 1) {
          setPosts(data);
        } else {
          setPosts([...posts, ...data]);
        }
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, [pageNumber]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get("p");
    if (postId && !isNaN(parseInt(postId))) {
      setSelectedPostId(postId);
      // Check if the post is already in the state
      const postExists = posts.some((post) => post.id.toString() === postId);
      if (!postExists) {
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
            setPosts([data, ...posts]); // Add the fetched post to the beginning of the list
            setFetchingSpecificPost(false);
          })
          .catch((error) => {
            setError(error.message);
            setFetchingSpecificPost(false);
          });
      }
    } else {
      setSelectedPostId(null);
    }
  }, [posts]); // Added dependency on posts

  useEffect(() => {
    // Listen for changes in the URL
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const postId = urlParams.get("p");
      setSelectedPostId(postId);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    // Update document title and meta description based on selectedPostId
    if (selectedPostId) {
      let selectedPost = posts.find(
        (post) => post.id.toString() === selectedPostId
      );
      if (selectedPost) {
        document.title = `${selectedPost.title.rendered} - WordPress Feed`;
        const metaDescription = document.querySelector(
          'meta[name="description"]'
        );
        if (metaDescription) {
          metaDescription.setAttribute(
            "content",
            selectedPost.excerpt.rendered.replace(/<[^>]*>/g, "")
          );
        }
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
  }, [selectedPostId, posts]);

  const handleReadMoreClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string
  ) => {
    e.preventDefault();
    setScrollPosition(window.scrollY); // Store current scroll position
    window.scrollTo(0, 0); // Scroll to top
    window.history.pushState({}, "", `?p=${id}`);
    setSelectedPostId(id);
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

  if (selectedPostId) {
    let selectedPost = posts.find(
      (post) => post.id.toString() === selectedPostId
    );

    // Handle the case where selectedPost is undefined
    if (!selectedPost) {
      return <div>Post not found</div>;
    }

    return (
      <div className="wordpress-post flex flex-col gap-4 p-6 max-w-screen-sm m-auto">
        <h1 className="text-4xl text-blue-600 font-bold">
          {selectedPost.title.rendered}
        </h1>
        <p className="text-sm text-gray-600 mt-2 mb-2">
          {new Date(selectedPost.date).toLocaleDateString()}
        </p>
        <div
          className="space-y-4"
          dangerouslySetInnerHTML={{
            __html: selectedPost.content.rendered,
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

  const visiblePosts = posts.slice(0, visiblePostsCount);

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
              setVisiblePostsCount(visiblePostsCount + 3);
              if (posts.length <= visiblePostsCount + 3) {
                setPageNumber(pageNumber + 1);
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
