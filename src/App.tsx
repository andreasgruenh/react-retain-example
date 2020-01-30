import React, {
  useState,
  ReactNode,
  useLayoutEffect,
  useRef,
  createContext,
  RefObject,
  useContext,
  useEffect,
  forwardRef,
  Ref
} from "react";
import "./styles.css";
import { createPortal } from "react-dom";
import { useSpring, animated, interpolate } from "react-spring";
import _ from "lodash";

export default function App() {
  const [index, setIndex] = useState(0);
  const [togglePage, setTogglePage] = useState(false);
  const pages = [<Page1 />, <Page2 />, <Page3 />, <Page4 />];
  const page = pages[index % pages.length];
  return (
    <CentralRetainer>
      <div>
        {pages.map((_, i) => (
          <button key={i} onClick={() => setIndex(i)}>
            Show {i}
          </button>
        ))}
        {page}
      </div>
    </CentralRetainer>
  );
}

function Page1() {
  return (
    <div>
      <h1>Page 1!</h1>
      <Retainer rKey="circle">
        <SquareOrCircle isCircle />
      </Retainer>
    </div>
  );
}

function Page2() {
  return (
    <div>
      <h1>Page 2!</h1>
      <br />
      <br />
      <br />
      <br />
      <div style={{ display: "flex" }}>
        <span> Das ist ein test Text</span>
        <Retainer rKey="circle">
          <SquareOrCircle />
        </Retainer>
      </div>
    </div>
  );
}

function Page3() {
  return (
    <div>
      <h1>Page 3!</h1>
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <div style={{ display: "flex" }}>
        <span> Das ist ein langer langer langer langer langer Text</span>
        <Retainer rKey="circle">
          <SquareOrCircle />
        </Retainer>
      </div>
    </div>
  );
}

function Page4() {
  const [order, setOrder] = useState(
    Array(5)
      .fill(0)
      .map((_, i) => i)
  );

  return (
    <div>
      <br />
      <br />
      <button onClick={() => setOrder(_.shuffle(order))}>Shuffle</button>
      {order.map((key, index) => (
        <Retainer rKey={"circle with index " + key} key={index}>
          <SquareOrCircle isCircle />
        </Retainer>
      ))}
    </div>
  );
}

const SquareOrCircle = function SquareOrCircle(props: { isCircle?: boolean }) {
  const [clientRect, setBoundingClientRect] = useState<ClientRect | undefined>(
    undefined
  );
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    setBoundingClientRect(ref.current.getBoundingClientRect());
  }, [props]);

  const [previousRect] = useRetainedValue(clientRect);

  const [spring, set] = useSpring(() => ({
    x: 0,
    y: 0
  }));

  useLayoutEffect(() => {
    if (!previousRect) return;
    const currentRect = ref.current.getBoundingClientRect();
    const xDif = currentRect.left - previousRect.left;
    const yDif = currentRect.top - previousRect.top;
    set({ x: -xDif, y: -yDif, immediate: true });
    set({ x: 0, y: 0, immediate: false });
  }, [previousRect]);

  return (
    <animated.div
      ref={ref}
      style={{
        transform: interpolate(
          [spring.x, spring.y],
          (x, y) => `translate3d(${x}px, ${y}px, 0)`
        )
      }}
      className={"square-or-circle " + (props.isCircle ? "circle" : "square")}
    />
  );
};

type RetainmentContext = {
  updateContent: (
    key: string,
    node: ReactNode,
    anchor: HTMLElement,
    identity: any
  ) => void;
};
const Context = createContext<RetainmentContext | null>(null);
const IdentityContext = createContext<any>(null);

function CentralRetainer(props: { children: ReactNode }) {
  const nodesByKey = useRef<Record<string, ReactNode>>({});
  const anchorsByKey = useRef<Record<string, HTMLElement>>({});
  const identityTokensByKey = useRef<Record<string, any>>({});
  const containersByKey = useRef<Record<string, HTMLElement>>({});

  const [_, setC] = useState(0);

  const methods: RefObject<RetainmentContext> = useRef({
    updateContent: (
      key: string,
      node: ReactNode,
      anchor: HTMLElement,
      identity: any
    ) => {
      if (!node) {
        if (identity !== identityTokensByKey.current[key]) return;
        delete nodesByKey.current[key];
        delete anchorsByKey.current[key];
        delete identityTokensByKey.current[key];
        delete containersByKey.current[key];
      } else {
        if (!containersByKey.current[key]) {
          containersByKey.current[key] = document.createElement("div");
        }
        nodesByKey.current[key] = (
          <IdentityContext.Provider value={identity}>
            {node}
          </IdentityContext.Provider>
        );
        anchorsByKey.current[key] = anchor;
        identityTokensByKey.current[key] = identity;
        anchor.appendChild(containersByKey.current[key]);
        anchor.getBoundingClientRect();
      }
      setC(c => c + 1);
    }
  });

  return (
    <>
      <Context.Provider value={methods.current}>
        {Object.keys(nodesByKey.current).map(key =>
          createPortal(
            nodesByKey.current[key],
            containersByKey.current[key],
            key
          )
        )}
        {props.children}
      </Context.Provider>
    </>
  );
}

function Retainer(props: { rKey: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const context = useContext(Context);

  useLayoutEffect(() => {
    return () => {
      setTimeout(() => {
        context.updateContent(props.rKey, null, null, ref);
      }, 0);
    };
  }, [props.rKey, context]);

  useLayoutEffect(() => {
    context.updateContent(
      props.rKey,
      props.children,
      ref.current.parentNode as HTMLElement,
      ref
    );
  });

  return <span ref={ref} />;
}

function useRetainedValue<ValueType>(
  currentValue: ValueType
): [ValueType | undefined, ValueType | undefined] {
  const identity = useContext(IdentityContext);
  const [preservedCurrentValue, setPreservedCurrentValue] = useState<
    ValueType | undefined
  >(currentValue);
  const [preservedPreviousValue, setPreservedPreviousValue] = useState<
    ValueType | undefined
  >(undefined);

  useLayoutEffect(() => {
    setPreservedPreviousValue(preservedCurrentValue);
  }, [identity]);

  useLayoutEffect(() => {
    setPreservedCurrentValue(currentValue);
  }, [currentValue]);

  return [preservedPreviousValue, preservedCurrentValue];
}

function useRetainedPosition(
  onInstanceChange: (previousRect: ClientRect, newRect: ClientRect) => void
) {
  const [clientRect, setBoundingClientRect] = useState<ClientRect | undefined>(
    undefined
  );
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const newClientRect = ref.current.getBoundingClientRect();
    if (_.isEqual(newClientRect, clientRect)) return;
    setBoundingClientRect(newClientRect);
  });

  const [previousRect] = useRetainedValue(clientRect);

  useLayoutEffect(() => {
    if (!previousRect) return;
    const currentRect = ref.current.getBoundingClientRect();
    onInstanceChange(previousRect, currentRect);
  }, [previousRect]);

  return ref;
}
