import React, {
  createContext,
  MutableRefObject,
  ReactNode,
  RefObject,
  useContext,
  useLayoutEffect,
  useRef,
  useState
} from "react";
import { createPortal } from "react-dom";
import {
  animated,
  useTransition,
  config,
  useSpring,
  interpolate
} from "react-spring";
import "./styles.css";

const pageContext = createContext<{
  goTo: (i: number) => void;
  index: number;
  animation: "push" | "stack-horizontal" | "stack-vertical";
} | null>(null);

export default function App() {
  const [index, setIndex] = useState(0);
  const [animationStyle, setAnimationStyle] = useState<
    "push" | "stack-horizontal" | "stack-vertical"
  >("push");
  const pages = [<Page1 />, <Page2 />, <Page3 />];
  const page = index > 2 ? <Page4 /> : pages[index];
  return (
    <pageContext.Provider
      value={{ goTo: setIndex, animation: animationStyle, index }}
    >
      <CentralRetainer>
        <div style={{ display: "flex" }}>
          <div className="page-container">{page}</div>
          <span style={{ width: 100 }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            Animation Style:
            <label>
              <input
                type="radio"
                name="style"
                defaultChecked
                onChange={e => setAnimationStyle("push")}
              />
              Push
            </label>
            <label>
              <input
                type="radio"
                name="style"
                onChange={e => setAnimationStyle("stack-horizontal")}
              />
              Stack horizontal
            </label>
            <label>
              <input
                type="radio"
                name="style"
                onChange={e => setAnimationStyle("stack-vertical")}
              />
              Stack Vertical
            </label>
          </div>
        </div>
      </CentralRetainer>
    </pageContext.Provider>
  );
}

function Page1() {
  const { goTo } = useContext(pageContext)!;
  return (
    <RetainingPage id="first" depth={1}>
      <a href="#" style={{ visibility: "hidden" }}>
        Back
      </a>
      <h1>Home</h1>
      <br />
      <br />
      <button onClick={() => goTo(1)}>Next</button>
    </RetainingPage>
  );
}

function Page2() {
  const { goTo } = useContext(pageContext)!;
  return (
    <RetainingPage id="second" depth={2}>
      <a href="#" onClick={() => goTo(0)}>
        Back
      </a>
      <h1>Details</h1>
      <br />
      <br />
      <button onClick={() => goTo(2)}>Next</button>
    </RetainingPage>
  );
}

function Page3() {
  const { goTo } = useContext(pageContext)!;
  return (
    <RetainingPage id="third" depth={3}>
      <a href="#" onClick={() => goTo(1)}>
        Back
      </a>
      <h1>All Images</h1>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {Array(9)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                width: "33.333%",
                height: 40,
                padding: 5
              }}
            >
              <Retainer rKey={"image-" + (3 + i)}>
                <PreviewBlock onClick={() => goTo(3 + i)} index={i} />
              </Retainer>
            </div>
          ))}
      </div>
    </RetainingPage>
  );
}

function Page4() {
  const { goTo, index } = useContext(pageContext)!;
  return (
    <RetainingPage id="fourth" depth={4} noMountingAnimation>
      <a href="#" onClick={() => goTo(2)}>
        Back
      </a>
      <h1>Img {index - 2}</h1>

      <div style={{ height: 200 }}>
        <Retainer rKey={"image-" + index}>
          <PreviewBlock expanded index={index - 3} />
        </Retainer>
      </div>
    </RetainingPage>
  );
}

function PreviewBlock(props: {
  expanded?: boolean;
  onClick?: () => void;
  index: number;
}) {
  const { expanded, ...rest } = props;
  const [_, reset] = useState(0);

  const [spring, set] = useSpring(() => ({
    x: 0,
    y: 0,
    width: !props.expanded ? 46 : 168,
    height: !props.expanded ? 30 : 200
  }));

  const gradients = [
    "linear-gradient(-45deg, #041dfc, #7e04b6)",
    "linear-gradient(-45deg, #ff0000, #7e04b6)",
    "linear-gradient(-45deg, #ff0000, #22ee00",
    "linear-gradient(-45deg, #0000dd, #22ee00",
    "linear-gradient(-45deg, #0000dd, #ddeeaa",
    "linear-gradient(-45deg, #eeaa12, #ddeeaa",
    "linear-gradient(-45deg, #eeaa12, #000000",
    "linear-gradient(-45deg, #ffffff, #000000",
    "linear-gradient(-45deg, #ffffff, #041dfc"
  ];

  useLayoutEffect(() => {
    setTimeout(() => {
      reset(c => c + 1);
    }, 500);
  }, []);

  const ref = useRetainedPosition<HTMLDivElement>((p, c, didUnmount) => {
    if (!p) return;
    const xDif = c.left - p.left;
    const yDif = c.top - p.top;
    set({
      x: -xDif,
      y: -yDif,
      width: props.expanded ? 46 : 168,
      height: props.expanded ? 30 : 200,
      immediate: true
    });
    set({
      x: 0,
      y: 0,
      width: !props.expanded ? 46 : 168,
      height: !props.expanded ? 30 : 200,
      immediate: false
    });
  });

  return (
    <animated.div
      {...rest}
      ref={ref}
      style={{
        transform: interpolate(
          [spring.x, spring.y],
          (x, y) => `translate3d(${x}px, ${y}px, 0)`
        ),
        width: spring.width,
        height: spring.height,
        background: gradients[props.index]
      }}
      className={"preview-block " + (props.expanded ? "expanded" : "")}
    />
  );
}

function RetainingPage(props: {
  id: string;
  children: ReactNode;
  depth: number;
  delayUnmountDuration?: number;
  noMountingAnimation?: boolean;
}) {
  return (
    <div>
      <Retainer rKey={"page"} delayUnmountDuration={props.delayUnmountDuration}>
        <Page {...props} />
      </Retainer>
    </div>
  );
}

function Page(props: {
  id: string;
  children: ReactNode;
  depth: number;
  noMountingAnimation?: boolean;
}) {
  const previousPropsRef = useRef(props);
  const { animation } = useContext(pageContext)!;
  useLayoutEffect(() => {
    previousPropsRef.current = props;
  });
  const previousProps = useRetainedValue(previousPropsRef);
  const currentProps = previousPropsRef.current;
  const direction = !previousProps
    ? 0
    : previousProps.depth < currentProps.depth
    ? 1
    : -1;
  const transitions = useTransition([currentProps], item => item.id, {
    from: i => ({
      transform: `translate3d(${
        currentProps.noMountingAnimation ||
        (previousProps && previousProps.noMountingAnimation)
          ? 0
          : animation === "push"
          ? direction * 200
          : animation === "stack-horizontal"
          ? direction < 0
            ? 1
            : 200
          : 0
      }px, ${
        currentProps.noMountingAnimation ||
        (previousProps && previousProps.noMountingAnimation)
          ? 0
          : animation === "stack-vertical"
          ? direction < 0
            ? 1
            : 400
          : 0
      }px, 0)`
    }),
    enter: i => ({
      transform: `translate3d(0px, 0, 0)`
    }),
    leave: i => ({
      transform: `translate3d(${
        currentProps.noMountingAnimation || previousProps!.noMountingAnimation
          ? 0
          : animation === "push"
          ? direction * -200
          : animation === "stack-horizontal"
          ? direction > 0
            ? 1
            : 200
          : 0
      }px, ${
        currentProps.noMountingAnimation || previousProps!.noMountingAnimation
          ? 0
          : animation === "stack-vertical"
          ? direction > 0
            ? 1
            : 400
          : 0
      }px, 0)`
    }),
    config: {
      duration: 200
    }
  });

  return (
    <>
      {transitions.map(({ item: s, key, props }) => (
        <animated.div
          key={key}
          style={{ ...props, zIndex: s.depth + 2 }}
          className="page"
        >
          {s.children}
        </animated.div>
      ))}
    </>
  );
}

type RetainmentContext = {
  updateContent: (
    key: string,
    node: ReactNode,
    anchor: HTMLElement | null,
    identity: any,
    delayUnmountDuration?: number
  ) => void;
};
const Context = createContext<RetainmentContext | null>(null);
const IdentityContext = createContext<any>(null);

function CentralRetainer(props: { children: ReactNode }) {
  const [, setC] = useState(0);
  const infoByKey = useRef<
    Record<
      string,
      {
        currentIdentity: any;
        anchorDOMNode: HTMLElement;
        nodeWithIdentityWrapper: ReactNode;
        nodeToRender: ReactNode;
        portalTargetContainer: HTMLElement;
        toBeRemoved: boolean;
      }
    >
  >({});

  function updateContent(
    key: string,
    node: ReactNode,
    anchor: HTMLElement | null,
    identity: any,
    delayUnmountDuration: number = 0
  ) {
    let info = infoByKey.current[key];
    if (!info) {
      info = {} as any;
      infoByKey.current[key] = info;
      info.portalTargetContainer = document.createElement("div");
      info.portalTargetContainer.classList.add("retaining-container");
    }

    if (!node) {
      if (identity !== info.currentIdentity) return;
      info.toBeRemoved = true;
      info.currentIdentity = null;
      info.nodeWithIdentityWrapper = (
        <IdentityContext.Provider value={identity}>
          {info.nodeToRender}
        </IdentityContext.Provider>
      );
      if (delayUnmountDuration > 0) {
        document.body.appendChild(info.portalTargetContainer);
        info.anchorDOMNode && info.anchorDOMNode.getBoundingClientRect();
        setC(c => c + 1);
      }
      setTimeout(() => {
        if (!info.toBeRemoved) return;
        if (info.portalTargetContainer.parentNode === document.body) {
          document.body.removeChild(info.portalTargetContainer);
        }
        delete infoByKey.current[key];
      }, delayUnmountDuration);
      return;
    }

    if (anchor) info.anchorDOMNode = anchor;
    info.toBeRemoved = false;
    info.currentIdentity = identity;
    if (info.anchorDOMNode) {
      info.anchorDOMNode.appendChild(info.portalTargetContainer);
    }

    if (node !== info.nodeToRender || info.currentIdentity !== identity) {
      info.anchorDOMNode && info.anchorDOMNode.getBoundingClientRect();
      info.nodeWithIdentityWrapper = (
        <IdentityContext.Provider value={identity}>
          {node}
        </IdentityContext.Provider>
      );
      info.nodeToRender = node;
      setC(c => c + 1);
    }
  }

  const methods: RefObject<RetainmentContext> = useRef({ updateContent });

  return (
    <>
      <Context.Provider value={methods.current}>
        {Object.keys(infoByKey.current).map(key => {
          const info = infoByKey.current[key];
          return createPortal(
            info.nodeWithIdentityWrapper,
            info.portalTargetContainer,
            key
          );
        })}
        {props.children}
      </Context.Provider>
    </>
  );
}

function Retainer(props: {
  rKey: string;
  children: ReactNode;
  delayUnmountDuration?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const context = useContext(Context);

  useLayoutEffect(() => {
    return () =>
      context!.updateContent(
        props.rKey,
        null,
        null,
        ref,
        props.delayUnmountDuration
      );
  }, [props.rKey, context]);

  useLayoutEffect(() => {
    context!.updateContent(
      props.rKey,
      props.children,
      ref.current!.parentNode as HTMLElement,
      ref,
      props.delayUnmountDuration
    );
  });

  return <span ref={ref} />;
}

function useRetainedValue<ValueType>(
  currentValueRef: MutableRefObject<ValueType>
): ValueType | undefined {
  const identity = useContext(IdentityContext);

  const [preservedPreviousValue, setPreservedPreviousValue] = useState<
    ValueType | undefined
  >(undefined);

  useLayoutEffect(() => {
    return () => {
      setPreservedPreviousValue(currentValueRef.current);
    };
  }, [identity]);

  return preservedPreviousValue;
}

function useRetainedPosition<RefType extends HTMLElement = HTMLElement>(
  onInstanceChange: (
    previousRect: ClientRect | undefined,
    newRect: ClientRect,
    didUnmount: boolean
  ) => void
) {
  const identity = useContext(IdentityContext);
  const rectRef = useRef<ClientRect>();
  const ref = useRef<RefType>(null);
  useLayoutEffect(() => {
    rectRef.current = ref.current!.getBoundingClientRect();
  });

  const previousRect = useRetainedValue(rectRef);

  useLayoutEffect(() => {
    const currentRect = ref.current!.getBoundingClientRect();
    onInstanceChange(previousRect, currentRect, !identity);
  }, [previousRect]);

  return ref;
}
