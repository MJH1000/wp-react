//import ListGroup from "./components/ListGroup";
//import Alert from "./components/Alert";
//import BlogPostList from "./components/BlogPostList";
//import PostList from "./components/PostList";
//import LatestPosts from "./components/LatestPosts";
//import WordPressPosts from "./components/WordPressPosts";
import WordPressFeed from "./components/WordPressFeed";

let heading = "Pets";
let items = ["dog", "cat"];
let apiUrl = "https://taylorau.com.au/wp-json";

let handleChange = (item: string) => console.log(item);

function App() {
  return (
    <div>
      {/* <BlogPostList /> */}
      {/* <BlogPostList /> */}
      <WordPressFeed />
    </div>
  );
}

export default App;
