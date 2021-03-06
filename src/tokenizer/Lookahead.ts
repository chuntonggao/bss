import { stdout } from '../util';
import ParseError from './ParseError';
import Token from './Token';

export default abstract class Lookahead<T> {
    protected itemBuffer: Array<T> = [];
    protected endReached = false;
    protected problemCollector: ParseError[] = [];
    protected endOfInputIndicator: T;

    public current(): T {
        const returnVal = this.next(0);
        if (process.env.NODE_ENV === 'debug') {
            if (returnVal instanceof Token) {
                stdout.success('next token is');
                stdout.info(returnVal.toString());
            }
        }
        return returnVal;
    }

    public next(offset?: number): T {
        if (typeof offset !== 'number') {
            return this.next(1);
        }
        if (offset < 0) {
            throw new Error('offset < 0');
        }
        while (this.itemBuffer.length <= offset && !this.endReached) {
            const item: T = this.fetch();
            if (item !== null) {
                this.itemBuffer.push(item);
            } else {
                this.endReached = true;
            }
        }
        if (offset >= this.itemBuffer.length) {
            if (
                this.endOfInputIndicator === null ||
                this.endOfInputIndicator === undefined
            ) {
                this.endOfInputIndicator = this.endOfInput();
            }
            return this.endOfInputIndicator;
        } else {
            return this.itemBuffer[offset];
        }
    }

    protected abstract endOfInput(): T;

    protected abstract fetch(): T;

    public consumeNoArg(): T {
        const result = this.current();
        this.consume(1);
        return result;
    }

    public consume(numberOfItems: number): void {
        if (numberOfItems < 0) {
            throw new Error('numberOfItems < 0');
        }
        while (numberOfItems-- > 0) {
            if (this.itemBuffer.length > 0) {
                this.itemBuffer.shift();
            } else {
                if (this.endReached) {
                    return;
                }
                const item: T = this.fetch();
                if (item === null) {
                    this.endReached = true;
                }
            }
        }
    }

    public getProblemCollector(): ParseError[] {
        return this.problemCollector;
    }

    public setProblemCollector(problemCollector: ParseError[]): void {
        this.problemCollector = problemCollector;
    }
}
