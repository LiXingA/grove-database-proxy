package servlet.common;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.charset.Charset;
import java.nio.file.FileSystems;
import java.nio.file.OpenOption;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class FileProcessor {

	private static Logger LOGGER = LoggerFactory.getLogger(FileProcessor.class);
	/**
	 * 文件编码
	 */
	public static final Charset utf8_charset = Charset.forName("UTF-8");
	/**
	 * 元素分隔号
	 */
	public final static String separator = ":";

	public static enum OpenType {

		/**
		 * 在文件尾添加内容
		 */
		AppendType,
		/**
		 * 重写文件，先清空再写
		 */
		ReWriteType,
		/**
		 * 创建文件 如果有该文件不会再创建
		 */
		CreateType,
		/**
		 * 读文件
		 */
		ReadType,
	}

	/**
	 * 获取文件的操作规则，，确保文件的操作是同步的
	 *
	 * @param openType
	 * @return
	 */
	public static Set<OpenOption> getSyncOpenOption(OpenType openType) {
		Set<OpenOption> openOpts = new HashSet<OpenOption>();
		switch (openType) {
			case AppendType:
				openOpts.add(StandardOpenOption.WRITE);
				openOpts.add(StandardOpenOption.APPEND);
				break;
			case ReWriteType:
				openOpts.add(StandardOpenOption.WRITE);
				openOpts.add(StandardOpenOption.TRUNCATE_EXISTING);
				break;
			case CreateType:
				openOpts.add(StandardOpenOption.WRITE);
				openOpts.add(StandardOpenOption.CREATE);
				break;
			case ReadType:
				openOpts.add(StandardOpenOption.READ);
				break;
			default:
				break;
		}
		openOpts.add(StandardOpenOption.SYNC);// 保证文件的操作是同步的
		return openOpts;
	}

	/**
	 * 创建文件 如果有改文件不会再创建
	 */
	public static void createDataFile(Path filepath) {
		Set<OpenOption> openOpts = getSyncOpenOption(OpenType.CreateType);
		FileChannel fc = null;
		try {
			fc = (FileChannel.open(filepath, openOpts));
		} catch (IOException x) {
			x.printStackTrace();
		} finally {
			try {
				if (fc != null) {
					fc.close();
				}
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
	}

	/**
	 * 文件添加数据
	 *
	 * @param element 加入的元素
	 */
	public static void append(Path filepath, String element) {
		Set<OpenOption> openOpts = getSyncOpenOption(OpenType.AppendType);
		FileChannel fc = null;
		try {
			fc = (FileChannel.open(filepath, openOpts));
			byte data[] = (element + separator).getBytes(utf8_charset);
			ByteBuffer out = ByteBuffer.wrap(data);
			fc.write(out);
		} catch (IOException x) {
			x.printStackTrace();
		} finally {
			try {
				if (fc != null) {
					fc.close();
				}
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
	}

	/**
	 * 重写文件
	 *
	 * @param elementList
	 */
	public static void rewriteElement(Path filepath, List<String> elementList) {
		Set<OpenOption> openOpts = getSyncOpenOption(OpenType.ReWriteType);
		FileChannel fc = null;
		try {
			fc = (FileChannel.open(filepath, openOpts));
			for (String entry : elementList) {
				byte data[] = (entry + separator).getBytes(utf8_charset);
				ByteBuffer out = ByteBuffer.wrap(data);
				fc.write(out);
			}
		} catch (IOException x) {
			x.printStackTrace();
		} finally {
			try {
				if (fc != null) {
					fc.close();
				}
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
	}

	/**
	 * 重写文件
	 *
	 * @param dataStr
	 */
	public static void rewriteString(Path filepath, String dataStr) {
		rewriteString(filepath, dataStr, Charset.defaultCharset());
	}

	/**
	 * 重写文件
	 *
	 * @param dataStr
	 */
	public static void rewriteString(Path filepath, String dataStr, Charset charset) {
		Set<OpenOption> openOpts = getSyncOpenOption(OpenType.ReWriteType);
		FileChannel fc = null;
		try {
			fc = (FileChannel.open(filepath, openOpts));
			byte data[] = dataStr.getBytes(charset);
			ByteBuffer out = ByteBuffer.wrap(data);
			fc.write(out);
		} catch (IOException e) {
			LOGGER.error(e.getMessage(), e);
		} finally {
			try {
				if (fc != null) {
					fc.close();
				}
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
	}

	/**
	 * 创建文件并写入
	 *
	 * @param dataStr
	 */
	public static void createFileAndWrite(Path filepath, String dataStr) {
		Set<OpenOption> openOpts = getSyncOpenOption(OpenType.CreateType);
		FileChannel fc = null;
		try {
			fc = (FileChannel.open(filepath, openOpts));
			byte data[] = dataStr.getBytes();
			ByteBuffer out = ByteBuffer.wrap(data);
			fc.write(out);
		} catch (IOException e) {
			LOGGER.error(e.getMessage(), e);
		} finally {
			try {
				if (fc != null) {
					fc.close();
				}
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
	}

	/**
	 * 读取文件为字符串
	 * 
	 * @param path
	 * @return
	 * @throws IOException
	 */
	public static String readString(String path) throws IOException {
		return readString(path, utf8_charset);
	}

	public static String readString(File file) throws IOException {
		BufferedReader bufferedReader = new BufferedReader(new FileReader(file));
		try {
			StringBuilder builder = new StringBuilder();
			String a;
			while ((a = bufferedReader.readLine()) != null) {
				builder.append(a);
			}
			return builder.toString();
		} finally {
			if (bufferedReader != null) {
				bufferedReader.close();
			}
		}
	}

	public static String readString(String path, Charset charset) throws IOException {
		Path filepath = FileSystems.getDefault().getPath(path);
		return readString(filepath, charset);
	}

	public static String readString(Path filepath) throws IOException {
		return readString(filepath, utf8_charset);
	}

	/**
	 * 读取文件
	 *
	 * @param filepath 路径
	 * @param charset  编码
	 * @return 字符串表示
	 * @throws IOException
	 */
	public static String readString(Path filepath, Charset charset) throws IOException {
		Set<OpenOption> openOpts = getSyncOpenOption(OpenType.ReadType);
		FileChannel fc = null;
		try {
			fc = (FileChannel.open(filepath, openOpts));
			int capacity = (int) fc.size();
			ByteBuffer out = ByteBuffer.allocate(capacity);
			fc.read(out);
			byte[] array = out.array();
			String str = new String(array, charset);
			return str;
		} finally {
			try {
				if (fc != null) {
					fc.close();
				}
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
	}

	/**
	 * 判断文件的编码格式
	 * 
	 * @param fileName :file
	 * @return 文件编码格式
	 * @throws Exception
	 */
	public static String codeString(File f) throws Exception {
		String charset = "GBK";
		byte[] first3Bytes = new byte[3];
		BufferedInputStream bis = new BufferedInputStream(new FileInputStream(f));
		try {
			boolean checked = false;
			bis.mark(0);
			int read = bis.read(first3Bytes, 0, 3);
			if (read == -1) {
				return charset; // 文件编码为 ANSI
			} else if (first3Bytes[0] == (byte) 0xFF && first3Bytes[1] == (byte) 0xFE) {
				charset = "UTF-16LE"; // 文件编码为 Unicode
				checked = true;
			} else if (first3Bytes[0] == (byte) 0xFE && first3Bytes[1] == (byte) 0xFF) {
				charset = "UTF-16BE"; // 文件编码为 Unicode big endian
				checked = true;
			} else if (first3Bytes[0] == (byte) 0xEF && first3Bytes[1] == (byte) 0xBB
					&& first3Bytes[2] == (byte) 0xBF) {
				charset = "UTF-8"; // 文件编码为 UTF-8
				checked = true;
			}
			bis.reset();
			if (!checked) {
				int loc = 0;
				while ((read = bis.read()) != -1) {
					loc++;
					if (read >= 0xF0)
						break;
					if (0x80 <= read && read <= 0xBF) // 单独出现BF以下的，也算是GBK
						break;
					if (0xC0 <= read && read <= 0xDF) {
						read = bis.read();
						if (0x80 <= read && read <= 0xBF) // 双字节 (0xC0 - 0xDF)
							// (0x80
							// - 0xBF),也可能在GB编码内
							continue;
						else
							break;
					} else if (0xE0 <= read && read <= 0xEF) {// 也有可能出错，但是几率较小
						read = bis.read();
						if (0x80 <= read && read <= 0xBF) {
							read = bis.read();
							if (0x80 <= read && read <= 0xBF) {
								charset = "UTF-8";
								break;
							} else
								break;
						} else
							break;
					}
				}
			}

		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			bis.close();
		}
		return charset;
	}

	/**
	 * 读取文件
	 *
	 * @return
	 */
	public static Map<String, String> readUsers(Path filepath) {
		Set<OpenOption> openOpts = getSyncOpenOption(OpenType.ReadType);
		Map<String, String> userMap = new HashMap<String, String>();
		FileChannel fc = null;
		try {
			fc = (FileChannel.open(filepath, openOpts));
			int capacity = (int) fc.size();
			ByteBuffer out = ByteBuffer.allocate(capacity);
			fc.read(out);
			byte[] array = out.array();
			String str = new String(array, utf8_charset);
			if (str != null && !str.equals("")) {
				String[] split = str.split(separator);
				if (split.length % 2 == 0) {
					for (int i = 0; i <= split.length - 2; i += 2) {
						String user = split[i];
						String pwd = split[i + 1];
						userMap.put(user, pwd);
					}
				} else {
					throw new IOException("用户文件出现问题！！！！");
				}
			}
		} catch (IOException x) {
			x.printStackTrace();
		} finally {
			try {
				if (fc != null) {
					fc.close();
				}
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
		return userMap;
	}

	/**
	 * 去掉换行符
	 * 
	 * @param resourceName
	 * @return
	 * @throws IOException
	 */
	public static final String readAllLines(String resourceName) throws IOException {
		InputStream input = FileProcessor.class.getClassLoader().getResource(resourceName).openStream();
		BufferedReader dis = new BufferedReader(new InputStreamReader(input));
		StringBuilder builder = new StringBuilder();
		String readLine = dis.readLine();
		builder.append(readLine);
		while (readLine != null) {
			readLine = dis.readLine();
			if (readLine != null)
				builder.append(readLine);
		}
		dis.close();
		input.close();
		return builder.toString();
	}

	public static final String read(String resourceName) throws IOException {
		return read(resourceName, null);
	}

	/**
	 * 
	 * @param resourceName 类路径
	 * @param charset
	 * @return
	 * @throws IOException
	 */
	public static final String read(String resourceName, Charset charset) throws IOException {
		InputStream input = FileProcessor.class.getClassLoader().getResource(resourceName).openStream();
		return read(input, charset);
	}

	public static final String read(InputStream input, Charset charset) throws IOException {
		StringBuilder builder = new StringBuilder();
		byte b[] = new byte[1000];
		int readOver = readOver(input, b);
		while (readOver > 0) {
			String readLine = charset == null ? new String(b, 0, readOver) : new String(b, 0, readOver, charset);
			builder.append(readLine);
			readOver = readOver(input, b);
		}
		input.close();
		return builder.toString();
	}

	/**
	 * 读取流，尽量将字节数组填满
	 * 
	 * @param input
	 * @param b
	 * @return 读取字节数
	 * @throws IOException
	 */
	public static final int readOver(InputStream input, byte b[]) throws IOException {
		int off = 0;
		int len = b.length;
		if (len <= 0)
			throw new IndexOutOfBoundsException();
		int n = 0;
		while (n < len) {
			int count = input.read(b, off + n, len - n);
			if (count < 0) {
				break;
			}
			n += count;
		}
		return n;
	}
}
