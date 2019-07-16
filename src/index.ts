import genericPool, { Factory } from 'generic-pool';
import phantom, { PhantomJS } from 'phantom';

// import initDebug from 'debug'
// const debug = initDebug('phantom-pool')

interface PhantomPoolInstance extends PhantomJS {
	useCount: number;
}

function initPhantomPool({
	max = 10,
	// optional. if you set this, make sure to drain() (see step 3)
	min = 2,
	// specifies how long a resource can stay idle in pool before being removed
	idleTimeoutMillis = 30000,
	// specifies the maximum number of times a resource can be reused before being destroyed
	maxUses = 50,
	testOnBorrow = true,
	phantomArgs = [],
	validator = (_instance: PhantomPoolInstance) => Promise.resolve(true),
	...otherConfig
} = {}) {
	// TODO: randomly destroy old instances to avoid resource leak?
	const factory = {
		async create() {
			const instance = await phantom.create(...phantomArgs) as PhantomPoolInstance;
			instance.useCount = 0;
			return instance;
		},
		async destroy(instance) {
			return instance.exit();
		},
		async validate(instance) {
			const valid = await validator(instance);
			return valid && (maxUses <= 0 || instance.useCount < maxUses);
		}
	} as Factory<PhantomPoolInstance>;
	const config = {
		idleTimeoutMillis,
		max,
		min,
		testOnBorrow,
		...otherConfig
	};
	const pool = genericPool.createPool(factory, config);
	const genericAcquire = pool.acquire.bind(pool);
	pool.acquire = async () => {
		const r = await genericAcquire();
		r.useCount += 1;
		return r;
	};
	pool.use = async (fn) => {
		const resource = await pool.acquire();
		try {
			return await fn(resource);
		} finally {
			pool.release(resource);
		}
	};

	return pool;
}

// To avoid breaking backwards compatibility
// https://github.com/binded/phantom-pool/issues/12
initPhantomPool.default = initPhantomPool;

export = initPhantomPool;
